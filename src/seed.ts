import * as lancedb from "@lancedb/lancedb";
import minimist from 'minimist';
import {
  RecursiveCharacterTextSplitter
} from 'langchain/text_splitter';
import {
  DirectoryLoader
} from 'langchain/document_loaders/fs/directory';
import {
  LanceDB, LanceDBArgs
} from "@langchain/community/vectorstores/lancedb";
import { Document } from "@langchain/core/documents";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import * as fs from 'fs';
import * as path from 'path';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { loadSummarizationChain } from "langchain/chains";
import { BaseLanguageModelInterface, BaseLanguageModelCallOptions } from "@langchain/core/language_models/base";
import { PromptTemplate } from "@langchain/core/prompts";
import * as crypto from 'crypto';
import config from './config';
import { extractMetadata, mergeMetadata } from './utils/metadata_extractor';
import { preprocessPdf, shouldSplitPdf } from './utils/pdf_processor';

const argv: minimist.ParsedArgs = minimist(process.argv.slice(2),{boolean: ["overwrite", "extract_images"]});

const databaseDir = argv["dbpath"];
const filesDir = argv["filesdir"];
const overwrite = argv["overwrite"];
const extractImages = argv["extract_images"] || false;

function validateArgs() {
    if (!databaseDir || !filesDir) {
        console.error("Please provide a database path (--dbpath) and a directory with files (--filesdir) to process");
        process.exit(1);
    }
    
    console.log("DATABASE PATH: ", databaseDir);
    console.log("FILES DIRECTORY: ", filesDir);
    console.log("OVERWRITE FLAG: ", overwrite);
    console.log("EXTRACT IMAGES FLAG: ", extractImages);
}

const contentOverviewPromptTemplate = `Write a high-level one sentence content overview based on the text below. 
If this appears to be a technical drawing or plan, describe what type of drawing it is and what it depicts.

"{text}"

WRITE THE CONTENT OVERVIEW ONLY, DO NOT WRITE ANYTHING ELSE:`;


const contentOverviewPrompt = new PromptTemplate({
  template: contentOverviewPromptTemplate,
  inputVariables: ["text"],
});

async function generateContentOverview(rawDocs: Document[], model: BaseLanguageModelInterface<any, BaseLanguageModelCallOptions>) {
  // This convenience function creates a document chain prompted to summarize a set of documents.
  const chain = loadSummarizationChain(model, { type: "map_reduce", combinePrompt: contentOverviewPrompt});
  const res = await chain.invoke({
    input_documents: rawDocs,
  });

  return res;
}

async function catalogRecordExists(catalogTable: lancedb.Table, hash: string): Promise<boolean> {
  const query = catalogTable.query().where(`hash="${hash}"`).limit(1);
  const results = await query.toArray();
  return results.length > 0;
}

// Enhanced PDF loader to handle large files
class EnhancedPDFLoader extends PDFLoader {
  // Declare the filePath property explicitly
  private sourcePath: string;
  
  constructor(filePath: string) {
    super(filePath);
    this.sourcePath = filePath;
  }
  
  async load(): Promise<Document[]> {
    try {
      // Check if this is a large PDF that needs to be split
      const needsSplitting = await shouldSplitPdf(this.sourcePath);
      
      if (needsSplitting) {
        console.log(`Large PDF detected: ${this.sourcePath}. Processing in chunks.`);
        
        // For now, we'll just process the first few pages for metadata
        // In the future, we'll implement proper PDF splitting
        const docs = await super.load();
        
        // Add a warning about large file processing
        docs.forEach(doc => {
          if (!doc.metadata.warning) {
            doc.metadata.warning = "Large PDF processed with limited content extraction";
          }
        });
        
        return docs;
      } else {
        // Process normal-sized PDFs as usual
        return super.load();
      }
    } catch (error) {
      console.error(`Error loading PDF ${this.sourcePath}:`, error);
      // Return an empty document to prevent the whole process from failing
      return [new Document({ 
        pageContent: `Error loading document: ${error.message}`, 
        metadata: { 
          source: this.sourcePath,
          error: error.message 
        } 
      })];
    }
  }
}

// Configure directory loader with the enhanced PDF loader
const directoryLoader = new DirectoryLoader(
  filesDir,
  {
   ".pdf": (path: string) => new EnhancedPDFLoader(path),
  },
);

// Initialize models based on configuration
const summarizationModel = new Ollama({ model: config.models.summarization });
const embeddingModel = new OllamaEmbeddings({ model: config.models.embedding });

// Temporary directory for processing split PDFs
const tempDir = path.join(databaseDir, "_temp_processing");

// prepares documents for summarization
// returns already existing sources and new catalog records
async function processDocuments(rawDocs: Document[], catalogTable: lancedb.Table, skipExistsCheck: boolean) {
    // Create temp directory if it doesn't exist
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    // group rawDocs by source for further processing
    const docsBySource = rawDocs.reduce((acc: Record<string, Document[]>, doc: Document) => {
        const source = doc.metadata.source;
        if (!acc[source]) {
            acc[source] = [];
        }
        acc[source].push(doc);
        return acc;
    }, {});

    let skipSources = [];
    let catalogRecords = [];

    // iterate over individual sources and get their summaries
    for (const [source, docs] of Object.entries(docsBySource)) {
        try {
            // Calculate hash of the source document
            const fileContent = await fs.promises.readFile(source);
            const hash = crypto.createHash('sha256').update(fileContent).digest('hex');

            // Check if a source document with the same hash already exists in the catalog
            const exists = skipExistsCheck ? false : await catalogRecordExists(catalogTable, hash);
            if (exists) {
                console.log(`Document with hash ${hash} already exists in the catalog. Skipping...`);
                skipSources.push(source);
            } else {
                // Get all text content from the document
                const allText = docs.map((doc: Document) => doc.pageContent).join(" ");
                
                // Use new metadata extraction approach
                const metadata = await extractMetadata(source, allText);
                
                // Generate content overview
                const contentOverview = await generateContentOverview(docs, summarizationModel);
                console.log(`Content overview for source ${source}:`, contentOverview);
                
                // Create catalog record with enhanced metadata
                catalogRecords.push(new Document({ 
                    pageContent: contentOverview["text"], 
                    metadata: { 
                        source, 
                        hash,
                        ...metadata
                    } 
                }));
            }
        } catch (error) {
            console.error(`Error processing document ${source}:`, error);
            // Continue with other documents
        }
    }

    return { skipSources, catalogRecords };
}   

/**
 * Enhances document chunks with metadata from catalog records
 * 
 * @param docs Document chunks to enhance
 * @param catalogRecords Catalog records with metadata
 * @returns Enhanced document chunks
 */
function enhanceDocumentsWithMetadata(docs: Document[], catalogRecords: Document[]) {
    // Create a map of source paths to metadata
    const metadataBySource = new Map();
    for (const record of catalogRecords) {
        metadataBySource.set(record.metadata.source, record.metadata);
    }
    
    // Apply metadata to each document chunk
    return docs.map(doc => {
        const sourcePath = doc.metadata.source;
        const catalogMetadata = metadataBySource.get(sourcePath);
        
        if (catalogMetadata) {
            // Copy metadata but preserve original 'loc' value
            const loc = doc.metadata.loc;
            
            // Create new metadata object with catalog metadata
            doc.metadata = { 
                ...catalogMetadata,
                loc // Preserve original location/chunk info
            };
        }
        
        return doc;
    });
}

async function seed() {
    validateArgs();

    const db = await lancedb.connect(databaseDir);

    let catalogTable: lancedb.Table;
    let catalogTableExists = true;
    let chunksTable: lancedb.Table;
    let chunksTableExists = true;

    try {
        catalogTable = await db.openTable(config.tables.catalog);
    } catch (e) {
        console.error(`Looks like the catalog table "${config.tables.catalog}" doesn't exist. We'll create it later.`);
        catalogTableExists = false;
    }

    try {
        chunksTable = await db.openTable(config.tables.chunks);
    } catch (e) {
        console.error(`Looks like the chunks table "${config.tables.chunks}" doesn't exist. We'll create it later.`);
        chunksTableExists = false;
    }

    // try dropping the tables if we need to overwrite
    if (overwrite) {
        try {
            if (catalogTableExists) await db.dropTable(config.tables.catalog);
            if (chunksTableExists) await db.dropTable(config.tables.chunks);
            catalogTableExists = false;
            chunksTableExists = false;
        } catch (e) {
            console.log("Error dropping tables. Maybe they don't exist!");
        }
    }

    // load files from the files path
    console.log("Loading files...")
    const rawDocs = await directoryLoader.load() as Document[];

    // save original metadata for each document
    for (const doc of rawDocs as Document[]) {
        // Keep just the essential metadata for now
        doc.metadata = { loc: doc.metadata.loc, source: doc.metadata.source };
    }

    console.log("Loading LanceDB catalog store...")

    const { skipSources, catalogRecords } = await processDocuments(rawDocs, catalogTable, overwrite || !catalogTableExists);
    
    // Create or update catalog store
    const catalogStore = catalogRecords.length > 0 ? 
        await LanceDB.fromDocuments(catalogRecords, 
            embeddingModel, 
            { mode: overwrite ? "overwrite" : undefined, uri: databaseDir, tableName: config.tables.catalog } as LanceDBArgs) :
        new LanceDB(embeddingModel, { uri: databaseDir, table: catalogTable});
    
    console.log("Number of new catalog records: ", catalogRecords.length);
    console.log("Number of skipped sources: ", skipSources.length);
    
    // Remove skipped sources from rawDocs
    const filteredRawDocs = rawDocs.filter((doc: Document) => !skipSources.includes(doc.metadata.source));

    console.log("Loading LanceDB vector store...")
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.text.chunkSize,
        chunkOverlap: config.text.chunkOverlap,
    });
    
    // Split documents into chunks
    let docs = await splitter.splitDocuments(filteredRawDocs);
    
    // Enhance document chunks with metadata from catalog records
    docs = enhanceDocumentsWithMetadata(docs, catalogRecords);
    
    // Create or update vector store for chunks
    const chunksStore = docs.length > 0 ? 
        await LanceDB.fromDocuments(docs, 
        embeddingModel, 
        { mode: overwrite ? "overwrite" : undefined, uri: databaseDir, tableName: config.tables.chunks } as LanceDBArgs) :
        new LanceDB(embeddingModel, { uri: databaseDir, table: chunksTable });

    console.log("Number of new chunks: ", docs.length);
    
    /*
     * TODO: Image Processing Enhancement
     * Future implementation steps:
     * 1. Extract images from PDF pages
     * 2. Process images through embedding model
     * 3. Store image embeddings in separate table
     * 4. Link images to source documents with metadata
     */
    if (extractImages) {
        console.log("Image extraction is not yet implemented.");
        // This will be implemented in Phase 2
    }
    
    // Clean up temp directory
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
        console.log("Error cleaning up temp directory:", e);
    }
    
    console.log("Seeding completed successfully!");
}

seed();

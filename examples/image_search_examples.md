# Image Search Examples for Construction Drawings

This document provides examples of how to use the new image search functionality in ClaudeHopper to find relevant construction drawings based on textual descriptions.

## Basic Image Search

### Finding Structural Plans

```javascript
// Search for structural plans
const results = await imageSearch({
  description: "structural foundation plan with dimensions"
});

// Filter by discipline
const structuralResults = await imageSearch({
  description: "concrete foundation details",
  discipline: "Structural"
});
```

### Finding Specific Drawing Types

```javascript
// Search for plan views
const planResults = await imageSearch({
  description: "building plan view",
  drawingType: "PLAN"
});

// Search for elevation drawings
const elevationResults = await imageSearch({
  description: "building elevation showing heights",
  drawingType: "ELEVATION"
});

// Search for sectional drawings
const sectionResults = await imageSearch({
  description: "cross section of structural elements",
  drawingType: "SECTION"
});
```

## Advanced Filtering

### Combining Multiple Filters

```javascript
// Search with multiple filters
const filteredResults = await imageSearch({
  description: "lift station concrete foundation with dimensions",
  discipline: "Structural",
  drawingType: "PLAN",
  project: "PDFdrawings"
});
```

### Searching Within a Specific Document

```javascript
// Search within a specific document
const sourceResults = await imageSearch({
  description: "lift station layout",
  source: "/Users/tfinlayson/Desktop/PDFdrawings-MCP/InputDocs/Drawings/S-46-1001.pdf"
});
```

## Example Queries for Common Construction Elements

Here are some example descriptions you can use to find common construction elements:

- "structural foundation with concrete walls"
- "mechanical equipment layout with piping connections"
- "electrical panel wiring diagram"
- "hvac ductwork layout in ceiling"
- "plumbing fixture installation details"
- "reinforced concrete beam connections"
- "structural steel column details"
- "site plan with drainage features"
- "architectural floor plan with dimensions"
- "roof framing plan with trusses"
- "wall section showing layers and materials"
- "staircase construction details"
- "elevator shaft dimensions and details"
- "foundation footing details with rebar"
- "concrete slab on grade with specifications"

## Tips for Effective Searching

1. **Be Specific**: Include key elements you're looking for (e.g., "concrete foundation with rebar" rather than just "foundation")

2. **Include Drawing Types**: Mention if you're looking for plans, sections, elevations, or details

3. **Mention Materials**: Include relevant materials (concrete, steel, wood, etc.)

4. **Use Technical Terms**: Construction-specific terminology will yield better results

5. **Combine with Filters**: Use the metadata filters (discipline, drawingType, etc.) to narrow down results

## Example Workflow

1. Start with a broad search to see what's available:
   ```javascript
   await imageSearch({description: "lift station"});
   ```

2. Refine your search with more specific details:
   ```javascript
   await imageSearch({description: "lift station lower level concrete foundation"});
   ```

3. Add filters to narrow down results:
   ```javascript
   await imageSearch({
     description: "lift station lower level concrete foundation",
     discipline: "Structural", 
     drawingType: "PLAN"
   });
   ```

4. If you know the drawing number, you can be very specific:
   ```javascript
   await imageSearch({
     description: "lift station 46 lower plan",
     drawingNumber: "S-46-1001"
   });
   ```

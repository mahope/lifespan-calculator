# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Danish lifespan calculator web application. Pure frontend - no build process or dependencies required.

## Development Commands

### Running the Application
```bash
# Open directly in browser (no build process needed)
start index.html

# Or serve via HTTP server for testing
python -m http.server 8000
# OR
npx serve .
```

### Validation
```bash
# Check JavaScript syntax
node -c script.js
```

## Architecture

### Core Structure
- **LifespanCalculator class** (`script.js:19`): Main application logic handling geolocation, calculations, and UI updates
- **lifeExpectancyData object** (`script.js:2`): Static country-specific life expectancy data with Danish translations
- **Utils object** (`script.js:243`): Helper functions for time conversions and age categorization

### Key Technical Points
- **Language**: Danish interface with English API calls
- **Geolocation flow**: Browser API → OpenStreetMap Nominatim → country mapping → calculation
- **Error handling**: Graceful fallback to world averages when location fails
- **HTTPS requirement**: Geolocation API requires HTTPS in production (use localhost for development)

### Data Flow
1. User inputs age/gender → enables location detection
2. Geolocation API gets coordinates → Nominatim API resolves to country
3. Country mapped to life expectancy data → calculation performed
4. Results displayed with contextual messaging

## Common Tasks

### Adding Countries
Update `lifeExpectancyData` object in `script.js:2`. Country names must match Nominatim API response format.

### Modifying Life Expectancy Data
All data in `lifeExpectancyData` constant. Include `male`, `female` values plus localized `country` name for display.

### Styling Changes
CSS uses custom properties for colors, mobile-first approach. Main color scheme: gradients from #667eea to #764ba2.

## File Structure
- `index.html` - Single page with semantic HTML structure
- `script.js` - ES6+ class-based architecture with utility functions
- `styles.css` - Modern responsive CSS with flexbox and animations
- `README.md` - Comprehensive Danish documentation
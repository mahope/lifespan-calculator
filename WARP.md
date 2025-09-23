# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

The Lifespan Calculator is a Danish web application that calculates estimated remaining lifespan based on age, gender, and geographic location. It's a pure frontend application built with vanilla HTML, CSS, and JavaScript, requiring no build process or dependencies.

## Architecture

### Core Components

- **LifespanCalculator class** (`script.js`): Main application logic handling user input, geolocation, and calculations
- **Static life expectancy data**: Hardcoded country-specific data for 12+ countries with fallback to world averages
- **Geolocation integration**: Uses browser's Geolocation API + OpenStreetMap Nominatim for reverse geocoding
- **Responsive UI**: Mobile-first CSS with gradient backgrounds and modern styling

### Data Flow

1. User inputs age/gender → enables location detection
2. Geolocation API gets coordinates → Nominatim API resolves to country
3. Country mapped to life expectancy data → calculation performed
4. Results displayed with contextual messaging based on outcome

### Key Technical Details

- **Language**: Danish (da) interface with English country names in API calls
- **APIs**: Browser Geolocation API, OpenStreetMap Nominatim (free, no auth)
- **Error handling**: Graceful fallback to world averages on location failures
- **HTTPS requirement**: Geolocation API requires HTTPS in production

## Development Commands

### Running the Application
```powershell
# Open directly in browser (no build process needed)
Start-Process "index.html"

# Or serve via simple HTTP server for testing
python -m http.server 8000
# OR
npx serve .
```

### Testing Geolocation Locally
Since geolocation requires HTTPS in production, for local development:
- Use `localhost` or `127.0.0.1` (works with HTTP)
- Or use a simple HTTPS server for more realistic testing

### Validation
```powershell
# Check HTML validation (if w3c-validator available)
html5validator index.html

# Check for JavaScript syntax errors
node -c script.js
```

## File Structure

- `index.html` - Single page application with semantic HTML structure
- `script.js` - ES6+ JavaScript with class-based architecture and utility functions
- `styles.css` - Modern CSS with flexbox, gradients, animations, and responsive design
- `README.md` - Comprehensive Danish documentation

## Common Development Tasks

### Adding New Countries
Update the `lifeExpectancyData` object in `script.js` with country data. Country names must match those returned by Nominatim API.

### Modifying Life Expectancy Data
All data is in the `lifeExpectancyData` constant. Include both `male` and `female` values plus localized `country` name for display.

### Extending Calculations
The `Utils` object contains helper functions for additional calculations like life percentage, age categories, and time conversions.

### Styling Changes
CSS uses custom properties for colors and follows a mobile-first approach. Key color scheme is based on gradients (#667eea to #764ba2).

## Deployment Considerations

- **HTTPS required** for geolocation in production
- Static hosting compatible (GitHub Pages, Netlify, Vercel)
- No build step or server-side requirements
- Consider rate limiting for Nominatim API in high-traffic scenarios

## Internationalization Notes

Currently Danish-only but structured for potential i18n:
- All user-facing text in HTML/JS can be externalized
- Date formatting uses Danish month names
- API calls use English (`accept-language=en`) for consistent country name mapping

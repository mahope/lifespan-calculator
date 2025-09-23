// Life expectancy data by country (sample data - in real implementation would use an API)
const lifeExpectancyData = {
    'Denmark': { male: 78.9, female: 82.7, country: 'Danmark' },
    'Sweden': { male: 80.8, female: 84.3, country: 'Sverige' },
    'Norway': { male: 80.5, female: 84.2, country: 'Norge' },
    'Germany': { male: 78.6, female: 83.4, country: 'Tyskland' },
    'United Kingdom': { male: 79.4, female: 83.1, country: 'Storbritannien' },
    'United States': { male: 76.3, female: 81.4, country: 'USA' },
    'France': { male: 79.7, female: 85.6, country: 'Frankrig' },
    'Netherlands': { male: 80.2, female: 83.9, country: 'Holland' },
    'Finland': { male: 78.7, female: 84.5, country: 'Finland' },
    'Iceland': { male: 81.3, female: 84.1, country: 'Island' },
    'Switzerland': { male: 81.9, female: 85.6, country: 'Schweiz' },
    'Japan': { male: 81.6, female: 87.7, country: 'Japan' },
    // Default fallback
    'World': { male: 72.6, female: 77.1, country: 'Verdensgennemsnit' }
};

class LifespanCalculator {
    constructor() {
        this.userLocation = null;
        this.lifeExpectancyForLocation = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const getLocationBtn = document.getElementById('getLocationBtn');
        const form = document.getElementById('lifespanForm');
        const ageInput = document.getElementById('age');
        const genderSelect = document.getElementById('gender');

        getLocationBtn.addEventListener('click', () => this.getUserLocation());
        form.addEventListener('submit', (e) => this.calculateLifespan(e));
        
        // Enable/disable calculate button based on form completion
        [ageInput, genderSelect].forEach(element => {
            element.addEventListener('input', () => this.updateCalculateButtonState());
        });
    }

    async getUserLocation() {
        const btn = document.getElementById('getLocationBtn');
        const status = document.getElementById('locationStatus');
        const info = document.getElementById('locationInfo');

        btn.disabled = true;
        btn.textContent = 'Henter lokation...';
        
        status.className = 'location-status loading';
        status.textContent = '📍 Finder din lokation...';
        info.textContent = '';

        if (!navigator.geolocation) {
            this.showLocationError('Din browser understøtter ikke geolokation.');
            return;
        }

        try {
            const position = await this.getCurrentPosition();
            const { latitude, longitude } = position.coords;
            
            status.textContent = '🔍 Henter information om din lokation...';
            
            // Get country information from coordinates
            const locationData = await this.getCountryFromCoordinates(latitude, longitude);
            
            if (locationData) {
                this.userLocation = locationData;
                this.lifeExpectancyForLocation = lifeExpectancyData[locationData.country] || lifeExpectancyData['World'];
                
                status.className = 'location-status success';
                status.textContent = '✅ Lokation fundet!';
                info.textContent = `📍 ${locationData.country}${locationData.city ? `, ${locationData.city}` : ''}`;
                
                btn.textContent = 'Lokation fundet ✓';
                this.updateCalculateButtonState();
            } else {
                throw new Error('Kunne ikke bestemme land fra koordinater');
            }
            
        } catch (error) {
            console.error('Location error:', error);
            this.showLocationError('Kunne ikke bestemme din lokation. Bruger verdensgennemsnit.');
            this.useWorldAverage();
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                { 
                    enableHighAccuracy: true, 
                    timeout: 10000, 
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    async getCountryFromCoordinates(lat, lon) {
        try {
            // Using OpenStreetMap Nominatim API for reverse geocoding (free, no API key needed)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`);
            
            if (!response.ok) {
                throw new Error('Geocoding API fejl');
            }
            
            const data = await response.json();
            
            if (data && data.address && data.address.country) {
                return {
                    country: data.address.country,
                    city: data.address.city || data.address.town || data.address.village || null,
                    countryCode: data.address.country_code?.toUpperCase()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    showLocationError(message) {
        const btn = document.getElementById('getLocationBtn');
        const status = document.getElementById('locationStatus');
        
        btn.disabled = false;
        btn.textContent = 'Prøv igen';
        
        status.className = 'location-status error';
        status.textContent = `❌ ${message}`;
    }

    useWorldAverage() {
        this.userLocation = { country: 'World', city: null };
        this.lifeExpectancyForLocation = lifeExpectancyData['World'];
        
        const btn = document.getElementById('getLocationBtn');
        const status = document.getElementById('locationStatus');
        const info = document.getElementById('locationInfo');
        
        btn.disabled = false;
        btn.textContent = 'Prøv igen';
        
        status.className = 'location-status success';
        status.textContent = '🌍 Bruger verdensgennemsnit';
        info.textContent = '📊 Baseret på globale data';
        
        this.updateCalculateButtonState();
    }

    updateCalculateButtonState() {
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const hasLocation = this.lifeExpectancyForLocation !== null;
        const btn = document.getElementById('calculateBtn');
        
        btn.disabled = !(age && gender && hasLocation);
    }

    calculateLifespan(event) {
        event.preventDefault();
        
        const age = parseInt(document.getElementById('age').value);
        const gender = document.getElementById('gender').value;
        
        if (!this.lifeExpectancyForLocation) {
            alert('Vælg venligst din lokation først');
            return;
        }

        const lifeExpectancy = this.lifeExpectancyForLocation[gender];
        const yearsLeft = Math.max(0, lifeExpectancy - age);
        
        // Calculate estimated end date
        const currentDate = new Date();
        const endDate = new Date(currentDate.getFullYear() + yearsLeft, currentDate.getMonth(), currentDate.getDate());
        
        this.displayResults({
            yearsLeft: yearsLeft,
            lifeExpectancy: lifeExpectancy,
            endDate: endDate,
            dataSource: this.lifeExpectancyForLocation.country,
            age: age,
            gender: gender
        });
    }

    displayResults(data) {
        // Update result values
        document.getElementById('yearsLeft').textContent = Math.round(data.yearsLeft * 10) / 10;
        document.getElementById('lifeExpectancy').textContent = `${data.lifeExpectancy} år`;
        document.getElementById('endDate').textContent = this.formatDate(data.endDate);
        document.getElementById('dataSource').textContent = data.dataSource;
        
        // Show results section
        const resultsSection = document.getElementById('results');
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Add some context based on results
        this.addContextualMessage(data);
    }

    addContextualMessage(data) {
        // This could be expanded to show different messages based on the results
        if (data.yearsLeft <= 0) {
            const disclaimer = document.querySelector('.disclaimer p');
            disclaimer.innerHTML = '<strong>Bemærk:</strong> Ifølge statistikken har du allerede overskredet den gennemsnitlige levetid for din demografi. Husk at dette kun er gennemsnitstal - mange mennesker lever meget længere end gennemsnittet! Faktorer som livsstil, sundhedspleje og genetik spiller en stor rolle.';
        } else if (data.yearsLeft > 50) {
            const disclaimer = document.querySelector('.disclaimer p');
            disclaimer.innerHTML = '<strong>Bemærk:</strong> Du har mange år foran dig! Dette er kun et statistisk estimat baseret på gennemsnitlige data. Teknologiske fremskridt og forbedret sundhedspleje kan øge levetiden betydeligt i fremtiden.';
        }
    }

    formatDate(date) {
        const months = [
            'januar', 'februar', 'marts', 'april', 'maj', 'juni',
            'juli', 'august', 'september', 'oktober', 'november', 'december'
        ];
        
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${day}. ${month} ${year}`;
    }
}

// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LifespanCalculator();
});

// Add some utility functions for potential future enhancements
const Utils = {
    // Function to convert years to days, months, etc.
    convertYears: (years) => {
        const days = Math.round(years * 365.25);
        const months = Math.round(years * 12);
        return { days, months, years: Math.round(years) };
    },
    
    // Function to calculate percentage of life lived
    calculateLifePercentage: (age, lifeExpectancy) => {
        return Math.round((age / lifeExpectancy) * 100);
    },
    
    // Function to get age category
    getAgeCategory: (age) => {
        if (age < 18) return 'barn/teenager';
        if (age < 30) return 'ung voksen';
        if (age < 50) return 'voksen';
        if (age < 65) return 'midaldrende';
        return 'ældre';
    }
};

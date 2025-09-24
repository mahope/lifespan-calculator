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
        this.countdownInterval = null;
        this.resultData = null;
        this.currentMode = 'simple';
        this.lifestyleFactors = {
            smoking: 0,
            exercise: 0,
            diet: 0,
            alcohol: 0,
            sleep: 0,
            stress: 0
        };
        this.achievements = [];
        this.availableAchievements = [
            { id: 'non-smoker', icon: '🙅', title: 'Ikke-ryger', desc: 'Du ryger ikke - det forlænger dit liv!', condition: () => this.lifestyleFactors.smoking >= 0 },
            { id: 'active-lifestyle', icon: '🏃', title: 'Aktiv livsstil', desc: 'Du dyrker regelmæssig motion', condition: () => this.lifestyleFactors.exercise >= 2 },
            { id: 'healthy-eater', icon: '🍎', title: 'Sund spiser', desc: 'Du spiser sundt og nærende mad', condition: () => this.lifestyleFactors.diet >= 3 },
            { id: 'wellness-warrior', icon: '🧘', title: 'Wellness kriger', desc: 'Du har lav stress og god søvn', condition: () => this.lifestyleFactors.stress >= 0 && this.lifestyleFactors.sleep >= 0 },
            { id: 'lifestyle-optimizer', icon: '🎆', title: 'Livsstils optimerer', desc: 'Du har optimeret alle aspekter af din livsstil', condition: () => Object.values(this.lifestyleFactors).reduce((sum, val) => sum + val, 0) >= 10 }
        ];
        this.initializeEventListeners();
        this.initializeLifestyleFactors();
        this.checkUrlParameters();
        this.tryAutoLocationDetection();
    }

    initializeEventListeners() {
        const getLocationBtn = document.getElementById('getLocationBtn');
        const form = document.getElementById('lifespanForm');
        const ageInput = document.getElementById('age');
        const birthdateInput = document.getElementById('birthdate');
        const genderInput = document.getElementById('gender');
        const genderButtons = document.querySelectorAll('.gender-btn');
        const shareBtn = document.getElementById('shareBtn');
        const newCalculationBtn = document.getElementById('newCalculationBtn');
        const calculateBtn = document.getElementById('calculateBtn');

        getLocationBtn.addEventListener('click', () => this.getUserLocation());
        form.addEventListener('submit', (e) => this.calculateLifespan(e));
        shareBtn?.addEventListener('click', () => this.shareResults());
        newCalculationBtn?.addEventListener('click', () => this.resetCalculation());

        // Set max date for birthdate input to today
        if (birthdateInput) {
            const today = new Date().toISOString().split('T')[0];
            birthdateInput.max = today;
            birthdateInput.addEventListener('change', () => {
                this.updateAgeFromBirthdate();
                this.updateCalculateButtonState();
            });
        }

        // Gender button selection
        genderButtons.forEach(button => {
            button.addEventListener('click', () => this.selectGender(button));
        });

        // Lifestyle factor buttons
        const factorButtons = document.querySelectorAll('.factor-btn');
        factorButtons.forEach(button => {
            button.addEventListener('click', () => this.selectLifestyleFactor(button));
        });

        // Mode selection buttons
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(button => {
            button.addEventListener('click', () => this.selectMode(button.dataset.mode));
        });

        // What-if scenario buttons
        const scenarioButtons = document.querySelectorAll('.scenario-btn');
        scenarioButtons.forEach(button => {
            button.addEventListener('click', () => this.showScenario(button.dataset.scenario));
        });

        // Enhanced form validation and feedback
        ageInput.addEventListener('input', () => {
            this.updateCalculateButtonState();
            this.updateFormFeedback();
        });
        ageInput.addEventListener('blur', () => this.validateField(ageInput));

        // Add loading state to calculate button
        calculateBtn.addEventListener('click', (e) => {
            if (!calculateBtn.disabled) {
                calculateBtn.classList.add('loading');
            }
        });
    }

    selectGender(selectedButton) {
        const genderButtons = document.querySelectorAll('.gender-btn');
        const genderInput = document.getElementById('gender');

        // Remove selected class from all buttons
        genderButtons.forEach(button => {
            button.classList.remove('selected');
        });

        // Add selected class to clicked button
        selectedButton.classList.add('selected');

        // Update hidden input value
        genderInput.value = selectedButton.dataset.gender;

        // Update form state
        this.updateCalculateButtonState();
        this.updateFormFeedback();
    }

    async tryAutoLocationDetection() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();

            if (data.country_name) {
                this.userLocation = {
                    country: data.country_name,
                    city: data.city,
                    region: data.region
                };
                this.lifeExpectancyForLocation = lifeExpectancyData[data.country_name] || lifeExpectancyData['World'];

                const btn = document.getElementById('getLocationBtn');
                btn.textContent = 'Lokation fundet ✓';
                btn.disabled = true;

                this.updateCalculateButtonState();
            }
        } catch (error) {
            console.log('Auto location detection failed, using manual method');
        }
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
            this.useWorldAverage();
            locationSection.style.display = 'none';
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
            this.useWorldAverage();
            // Hide location section and use world average
            locationSection.style.display = 'none';
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

    // Function removed - no longer showing location errors

    useWorldAverage() {
        this.userLocation = { country: 'World', city: null };
        this.lifeExpectancyForLocation = lifeExpectancyData['World'];
        
        status.className = 'location-status success';
        status.textContent = '🌍 Bruger verdensgennemsnit';
        info.textContent = '📊 Baseret på globale data';
        
        this.updateCalculateButtonState();
    }

    updateCalculateButtonState() {
        const age = document.getElementById('age').value;
        const birthdate = document.getElementById('birthdate').value;
        const gender = document.getElementById('gender').value;
        const hasLocation = this.lifeExpectancyForLocation !== null;
        const btn = document.getElementById('calculateBtn');

        // Check age validity based on current mode
        const isValidAge = this.currentMode === 'simple'
            ? (age && age >= 0 && age <= 120)
            : (birthdate && this.isValidBirthdate(birthdate));

        const isValid = isValidAge && gender && hasLocation;
        btn.disabled = !isValid;

        if (isValid) {
            const modeText = this.currentMode === 'simple' ? 'Simpel beregning' : 'Avanceret beregning';
            btn.textContent = `📈 ${modeText}`;
        } else if (!hasLocation) {
            btn.textContent = 'Venter på lokation...';
        } else {
            btn.textContent = 'Udfyld alle felter';
        }

        // Update form progress
        this.updateFormProgress();
    }

    updateFormProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (!progressFill || !progressText) return;

        const age = document.getElementById('age').value;
        const birthdate = document.getElementById('birthdate').value;
        const gender = document.getElementById('gender').value;
        const hasLocation = this.lifeExpectancyForLocation !== null;
        const hasMode = this.currentMode !== null;

        // Determine which age input is active based on mode
        const isValidAge = this.currentMode === 'simple'
            ? (age && age >= 0 && age <= 120)
            : (birthdate && this.isValidBirthdate(birthdate));

        // Update input group visual feedback for age/birthdate
        const ageGroup = document.getElementById('ageGroup');
        const birthdateGroup = document.getElementById('birthdateGroup');

        if (this.currentMode === 'simple' && ageGroup) {
            if (isValidAge) {
                ageGroup.classList.add('filled');
            } else {
                ageGroup.classList.remove('filled');
            }
        } else if (this.currentMode === 'advanced' && birthdateGroup) {
            if (isValidAge) {
                birthdateGroup.classList.add('filled');
            } else {
                birthdateGroup.classList.remove('filled');
            }
        }

        // Update gender visual feedback
        const genderContainer = document.querySelector('.gender-buttons');
        if (genderContainer) {
            const parentGroup = genderContainer.closest('.input-group');
            if (parentGroup) {
                if (gender) {
                    parentGroup.classList.add('filled');
                } else {
                    parentGroup.classList.remove('filled');
                }
            }
        }

        let completedFields = 0;
        let totalFields = 4; // Mode, Age/Birthdate, Gender, Location

        if (hasMode) completedFields++;
        if (isValidAge) completedFields++;
        if (gender) completedFields++;
        if (hasLocation) completedFields++;

        const progress = Math.round((completedFields / totalFields) * 100);

        progressFill.style.width = `${progress}%`;

        if (progress === 100) {
            progressText.textContent = 'Formularen er udfyldt';
            progressText.classList.add('complete');
        } else {
            progressText.textContent = `${progress}% udfyldt (${completedFields}/${totalFields} felter)`;
            progressText.classList.remove('complete');
        }
    }

    isValidBirthdate(birthdate) {
        if (!birthdate) return false;

        const birthDate = new Date(birthdate);
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

        return birthDate <= today && birthDate >= minDate;
    }

    validateField(field) {
        const value = field.value;

        if (field.id === 'age') {
            const age = parseInt(value);
            if (age < 0 || age > 120) {
                field.style.borderColor = '#fed7d7';
                field.style.backgroundColor = '#fef5e7';
            } else if (value) {
                field.style.borderColor = 'var(--success-border)';
                field.style.backgroundColor = 'var(--secondary-bg)';
            }
        }
    }

    selectLifestyleFactor(selectedButton) {
        const factor = selectedButton.dataset.factor;
        const value = parseInt(selectedButton.dataset.value);

        // Remove active class from siblings
        const factorButtons = document.querySelectorAll(`[data-factor="${factor}"]`);
        factorButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to selected button
        selectedButton.classList.add('active');

        // Update lifestyle factors
        this.lifestyleFactors[factor] = value;

        // Update UI
        this.updateLifestyleImpact();
        this.updateFormFeedback();
        this.checkAchievements();
    }

    updateLifestyleImpact() {
        // Update individual factor displays
        Object.keys(this.lifestyleFactors).forEach(factor => {
            const impact = this.lifestyleFactors[factor];
            const impactElement = document.getElementById(`${factor}Impact`);

            if (impactElement) {
                const displayValue = impact > 0 ? `+${impact}` : `${impact}`;
                impactElement.textContent = `${displayValue} år`;

                // Update styling based on impact
                impactElement.className = 'factor-impact';
                if (impact > 0) {
                    impactElement.classList.add('positive');
                } else if (impact < 0) {
                    impactElement.classList.add('negative');
                } else {
                    impactElement.classList.add('neutral');
                }
            }
        });

        // Calculate total lifestyle impact
        const totalImpact = Object.values(this.lifestyleFactors).reduce((sum, value) => sum + value, 0);
        const totalElement = document.getElementById('lifestyleTotal');
        const scoreElement = document.getElementById('scoreFill');
        const scoreTextElement = document.getElementById('scoreText');

        if (totalElement) {
            const displayValue = totalImpact > 0 ? `+${totalImpact}` : `${totalImpact}`;
            totalElement.textContent = `${displayValue} år`;

            // Update total styling
            totalElement.className = 'total-value';
            if (totalImpact > 0) {
                totalElement.classList.add('positive');
            } else if (totalImpact < 0) {
                totalElement.classList.add('negative');
            } else {
                totalElement.classList.add('neutral');
            }
        }

        // Update score bar (range: -20 to +20, mapped to 0-100%)
        if (scoreElement && scoreTextElement) {
            const percentage = Math.max(0, Math.min(100, ((totalImpact + 20) / 40) * 100));
            scoreElement.style.width = `${percentage}%`;

            // Update score text
            if (totalImpact >= 10) {
                scoreTextElement.textContent = '🎆 Fantastisk livsstil!';
                scoreTextElement.style.color = '#22543d';
            } else if (totalImpact >= 5) {
                scoreTextElement.textContent = '🌟 Rigtig god livsstil';
                scoreTextElement.style.color = '#22543d';
            } else if (totalImpact >= 0) {
                scoreTextElement.textContent = '🙂 God livsstil';
                scoreTextElement.style.color = '#4a5568';
            } else if (totalImpact >= -5) {
                scoreTextElement.textContent = '😐 Gennemsnitlig livsstil';
                scoreTextElement.style.color = '#4a5568';
            } else if (totalImpact >= -10) {
                scoreTextElement.textContent = '😔 Der er plads til forbedring';
                scoreTextElement.style.color = '#d69e2e';
            } else {
                scoreTextElement.textContent = '⚠️ Overvej ændringer';
                scoreTextElement.style.color = '#c53030';
            }
        }
    }

    getAdjustedLifeExpectancy(baseLifeExpectancy) {
        if (this.currentMode === 'simple') {
            return baseLifeExpectancy;
        }
        const totalImpact = Object.values(this.lifestyleFactors).reduce((sum, value) => sum + value, 0);
        return Math.max(baseLifeExpectancy + totalImpact, 0);
    }

    updateFormFeedback() {
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const hasLocation = this.lifeExpectancyForLocation !== null;
        const formSection = document.querySelector('.form-section');

        if (age && gender && hasLocation) {
            formSection.classList.add('ready');
        } else {
            formSection.classList.remove('ready');
        }
    }

    initializeLifestyleFactors() {
        // Set default active buttons and update display
        const defaultButtons = document.querySelectorAll('.factor-btn.active');
        defaultButtons.forEach(button => {
            const factor = button.dataset.factor;
            const value = parseInt(button.dataset.value);
            this.lifestyleFactors[factor] = value;
        });
        this.updateLifestyleImpact();
        this.updateModeDisplay();
    }

    selectMode(mode) {
        this.currentMode = mode;

        // Update mode button states
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        this.updateModeDisplay();
        this.updateCalculateButtonState();
    }

    updateModeDisplay() {
        const lifestyleSection = document.querySelector('.lifestyle-section');
        const achievementPreview = document.getElementById('achievementPreview');
        const ageGroup = document.getElementById('ageGroup');
        const birthdateGroup = document.getElementById('birthdateGroup');

        if (this.currentMode === 'simple') {
            // Simple mode: show age input, hide birthdate and lifestyle
            lifestyleSection.classList.remove('show');
            if (achievementPreview) achievementPreview.style.display = 'none';

            ageGroup.classList.remove('hidden');
            birthdateGroup.classList.add('hidden');

            // Reset lifestyle factors to neutral for simple mode
            this.lifestyleFactors = {
                smoking: 0,
                exercise: 0,
                diet: 0,
                alcohol: 0,
                sleep: 0,
                stress: 0
            };
        } else {
            // Advanced mode: show birthdate input, hide age, show lifestyle
            lifestyleSection.classList.add('show');

            ageGroup.classList.add('hidden');
            birthdateGroup.classList.remove('hidden');
            birthdateGroup.classList.add('show');

            this.initializeLifestyleFactors();
        }
    }

    updateAgeFromBirthdate() {
        const birthdateInput = document.getElementById('birthdate');
        const ageInput = document.getElementById('age');

        if (!birthdateInput.value) {
            ageInput.value = '';
            return;
        }

        const birthDate = new Date(birthdateInput.value);
        const today = new Date();

        // Calculate precise age
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // Update the age input (hidden but used for calculations)
        ageInput.value = age;
    }

    calculatePreciseAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);

        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        let days = today.getDate() - birth.getDate();

        if (days < 0) {
            months--;
            const daysInPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
            days += daysInPreviousMonth;
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // Return age as decimal for more precise calculations
        return years + (months / 12) + (days / 365);
    }

    checkAchievements() {
        this.availableAchievements.forEach(achievement => {
            if (!this.achievements.includes(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        this.achievements.push(achievement.id);
        this.showAchievementNotification(achievement);
        setTimeout(() => this.updateAchievementsDisplay(), 1000);
    }

    showAchievementNotification(achievement) {
        const preview = document.getElementById('achievementPreview');
        const icon = document.getElementById('achievementIcon');
        const title = document.getElementById('achievementTitle');
        const desc = document.getElementById('achievementDesc');

        if (preview && icon && title && desc) {
            icon.textContent = achievement.icon;
            title.textContent = achievement.title;
            desc.textContent = achievement.desc;

            preview.style.display = 'block';

            setTimeout(() => {
                preview.style.display = 'none';
            }, 4000);
        }
    }

    updateAchievementsDisplay() {
        const grid = document.getElementById('achievementsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.availableAchievements.forEach(achievement => {
            const card = document.createElement('div');
            card.className = `achievement-card ${this.achievements.includes(achievement.id) ? 'earned' : ''}`;

            card.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            `;

            grid.appendChild(card);
        });
    }

    showScenario(scenarioType) {
        const resultDiv = document.getElementById('scenarioResult');
        const textEl = document.getElementById('scenarioText');
        const changeEl = document.getElementById('scenarioChange');

        if (!resultDiv || !textEl || !changeEl) return;

        let scenarioText = '';
        let yearChange = 0;

        switch(scenarioType) {
            case 'quit-smoking':
                if (this.lifestyleFactors.smoking < 0) {
                    yearChange = Math.abs(this.lifestyleFactors.smoking);
                    scenarioText = 'Hvis du stopper med at ryge kunne du vinde:';
                } else {
                    scenarioText = 'Du ryger allerede ikke - fantastisk!';
                }
                break;
            case 'more-exercise':
                if (this.lifestyleFactors.exercise < 6) {
                    yearChange = 6 - this.lifestyleFactors.exercise;
                    scenarioText = 'Hvis du øger din motion til 7+ timer/uge:';
                }
                break;
            case 'healthy-diet':
                if (this.lifestyleFactors.diet < 5) {
                    yearChange = 5 - this.lifestyleFactors.diet;
                    scenarioText = 'Hvis du skifter til en meget sund kost:';
                }
                break;
            case 'less-stress':
                if (this.lifestyleFactors.stress < 3) {
                    yearChange = 3 - this.lifestyleFactors.stress;
                    scenarioText = 'Hvis du reducerer dit stress betydeligt:';
                }
                break;
        }

        textEl.textContent = scenarioText;
        changeEl.textContent = yearChange > 0 ? `+${yearChange} år` : 'Du er allerede optimal!';
        changeEl.style.background = yearChange > 0 ? 'var(--success-bg)' : 'var(--border-light)';
        changeEl.style.color = yearChange > 0 ? '#22543d' : 'var(--text-muted)';

        resultDiv.style.display = 'block';

        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 8000);
    }

    calculateLifespan(event) {
        event.preventDefault();

        const calculateBtn = document.getElementById('calculateBtn');

        // Add loading animation
        calculateBtn.classList.add('loading');

        // Simulate brief processing time for UX
        setTimeout(() => {
            let age;
            const birthdate = document.getElementById('birthdate').value;
            const gender = document.getElementById('gender').value;

            // Get age based on current mode
            if (this.currentMode === 'simple') {
                age = parseInt(document.getElementById('age').value);
            } else {
                if (!birthdate || !this.isValidBirthdate(birthdate)) {
                    calculateBtn.classList.remove('loading');
                    alert('Indtast venligst en gyldig fødselsdato.');
                    return;
                }
                // Use precise age calculation for advanced mode
                age = this.calculatePreciseAge(birthdate);
            }

            if (!this.lifeExpectancyForLocation) {
                calculateBtn.classList.remove('loading');
                alert('Der opstod en fejl med lokationsbestemmelsen. Prøv igen.');
                return;
            }

            if (age < 0 || age > 120) {
                calculateBtn.classList.remove('loading');
                alert('Indtast venligst en gyldig alder mellem 0 og 120 år.');
                return;
            }

            const baseLifeExpectancy = this.lifeExpectancyForLocation[gender];
            const adjustedLifeExpectancy = this.getAdjustedLifeExpectancy(baseLifeExpectancy);
            const yearsLeft = Math.max(0, adjustedLifeExpectancy - age);

            // Calculate estimated end date
            const currentDate = new Date();
            const endDate = new Date(currentDate.getFullYear() + yearsLeft, currentDate.getMonth(), currentDate.getDate());

            this.resultData = {
                yearsLeft: yearsLeft,
                lifeExpectancy: adjustedLifeExpectancy,
                baseLifeExpectancy: baseLifeExpectancy,
                lifestyleImpact: Object.values(this.lifestyleFactors).reduce((sum, value) => sum + value, 0),
                endDate: endDate,
                dataSource: this.lifeExpectancyForLocation.country,
                age: age,
                gender: gender
            };

            calculateBtn.classList.remove('loading');
            this.displayResults(this.resultData);
        }, 500);
    }

    displayResults(data) {
        // Update result values
        document.getElementById('yearsLeft').textContent = `${Math.round(data.yearsLeft * 10) / 10} år`;
        document.getElementById('lifeExpectancy').textContent = `${data.lifeExpectancy} år`;
        document.getElementById('endDate').textContent = this.formatDate(data.endDate);
        document.getElementById('dataSource').textContent = data.dataSource;

        // Show lifestyle impact (only in advanced mode)
        const lifestyleImpactEl = document.getElementById('lifestyleImpactDisplay');
        if (lifestyleImpactEl) {
            if (this.currentMode === 'advanced' && data.lifestyleImpact !== undefined) {
                const impact = data.lifestyleImpact > 0 ? `+${data.lifestyleImpact}` : `${data.lifestyleImpact}`;
                lifestyleImpactEl.textContent = `${impact} år`;
                lifestyleImpactEl.style.color = data.lifestyleImpact > 0 ? '#22543d' : data.lifestyleImpact < 0 ? '#c53030' : '#4a5568';
                lifestyleImpactEl.parentElement.style.display = 'flex';
            } else {
                lifestyleImpactEl.parentElement.style.display = 'none';
            }
        }

        // Update life progress visualization
        this.updateLifeProgress(data);

        // Update fun facts
        this.updateFunFacts(data);

        // Update achievements display (only in advanced mode)
        if (this.currentMode === 'advanced') {
            this.updateAchievementsDisplay();
            document.querySelector('.achievements-section').style.display = 'block';
            document.querySelector('.what-if-section').style.display = 'block';
        } else {
            document.querySelector('.achievements-section').style.display = 'none';
            document.querySelector('.what-if-section').style.display = 'none';
        }

        // Track calculation completion
        if (typeof window.plausible === 'function') {
            window.plausible('Calculator Used', {
                props: {
                    mode: this.currentMode,
                    gender: data.gender,
                    country: data.country,
                    age_group: this.getAgeGroupForAnalytics(data.age)
                }
            });
        }

        // Show results section and hide form
        const resultsSection = document.getElementById('results');
        const formSection = document.querySelector('.form-section');

        formSection.classList.add('hidden');
        setTimeout(() => {
            formSection.style.display = 'none';
            resultsSection.classList.add('show');

            // Smooth scroll to top after results are shown
            setTimeout(() => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 100);
        }, 300);

        // Start countdown timer
        this.startCountdownTimer(data.yearsLeft);

        // Add some context based on results
        this.addContextualMessage(data);
    }

    updateLifeProgress(data) {
        const lifePercentage = Math.round((data.age / data.lifeExpectancy) * 100);
        const liveLivedEl = document.getElementById('lifeLived');
        const lifeRemainingEl = document.getElementById('lifeRemaining');
        const currentMarkerEl = document.getElementById('currentMarker');
        const lifePercentageEl = document.getElementById('lifePercentage');
        const daysLivedEl = document.getElementById('daysLived');
        const heartbeatsEl = document.getElementById('heartbeats');

        if (liveLivedEl && lifeRemainingEl) {
            liveLivedEl.style.width = `${lifePercentage}%`;
            lifeRemainingEl.style.width = `${100 - lifePercentage}%`;
        }

        if (currentMarkerEl) {
            currentMarkerEl.style.left = `${lifePercentage}%`;
        }

        if (lifePercentageEl) {
            lifePercentageEl.textContent = `${lifePercentage}%`;
        }

        if (daysLivedEl) {
            const daysLived = Math.round(data.age * 365.25);
            daysLivedEl.textContent = daysLived.toLocaleString();
        }

        if (heartbeatsEl) {
            // Average 70 beats per minute
            const heartbeats = Math.round(data.age * 365.25 * 24 * 60 * 70);
            heartbeatsEl.textContent = this.formatLargeNumber(heartbeats);
        }
    }

    updateFunFacts(data) {
        const sunrisesEl = document.getElementById('sunrises');
        const wordsSpokenEl = document.getElementById('wordsSpoken');
        const heartbeatsEl = document.getElementById('heartbeats');
        const sleepHoursEl = document.getElementById('sleepHours');
        const blinksEl = document.getElementById('blinks');
        const breathsEl = document.getElementById('breaths');
        const stepsEl = document.getElementById('steps');
        const mealsEl = document.getElementById('meals');
        const coffeeCupsEl = document.getElementById('coffeeCups');
        const laughsEl = document.getElementById('laughs');
        const waterLitersEl = document.getElementById('waterLiters');
        const spaceKmEl = document.getElementById('spaceKm');

        if (sunrisesEl) {
            const sunrises = Math.round(data.age * 365.25);
            sunrisesEl.textContent = sunrises.toLocaleString('da-DK');
        }

        if (wordsSpokenEl) {
            // Average 16,000 words per day
            const wordsSpoken = Math.round(data.age * 365.25 * 16000);
            wordsSpokenEl.textContent = this.formatLargeNumber(wordsSpoken);
        }

        if (heartbeatsEl) {
            // Average 100,000 beats per day
            const heartbeats = Math.round(data.age * 365.25 * 100000);
            heartbeatsEl.textContent = this.formatLargeNumber(heartbeats);
        }

        if (sleepHoursEl) {
            // Average 8 hours per day
            const sleepHours = Math.round(data.age * 365.25 * 8);
            sleepHoursEl.textContent = this.formatLargeNumber(sleepHours);
        }

        if (blinksEl) {
            // Average 17 blinks per minute, 16 waking hours per day
            const blinks = Math.round(data.age * 365.25 * 16 * 60 * 17);
            blinksEl.textContent = this.formatLargeNumber(blinks);
        }

        if (breathsEl) {
            // Average 14 breaths per minute
            const breaths = Math.round(data.age * 365.25 * 24 * 60 * 14);
            breathsEl.textContent = this.formatLargeNumber(breaths);
        }

        if (stepsEl) {
            // Average 7,000 steps per day
            const steps = Math.round(data.age * 365.25 * 7000);
            stepsEl.textContent = this.formatLargeNumber(steps);
        }

        if (mealsEl) {
            // 3 meals per day
            const meals = Math.round(data.age * 365.25 * 3);
            mealsEl.textContent = meals.toLocaleString('da-DK');
        }

        if (coffeeCupsEl) {
            // Danish average: 3.4 cups per day (start from age 15)
            const coffeeAge = Math.max(0, data.age - 15);
            const coffeeCups = Math.round(coffeeAge * 365.25 * 3.4);
            coffeeCupsEl.textContent = coffeeCups.toLocaleString('da-DK');
        }

        if (laughsEl) {
            // Average 17 laughs per day
            const laughs = Math.round(data.age * 365.25 * 17);
            laughsEl.textContent = laughs.toLocaleString('da-DK');
        }

        if (waterLitersEl) {
            // 2 liters per day
            const waterLiters = Math.round(data.age * 365.25 * 2);
            waterLitersEl.textContent = waterLiters.toLocaleString('da-DK');
        }

        if (spaceKmEl) {
            // Earth travels ~940 million km around the sun per year
            const spaceKm = Math.round(data.age * 940000000);
            // Format as millions of km
            const millionKm = (spaceKm / 1000000).toFixed(0);
            spaceKmEl.textContent = millionKm.toLocaleString('da-DK') + ' mio.';
        }
    }

    formatLargeNumber(num) {
        if (num >= 1000000000) {
            // Milliarder
            const billions = (num / 1000000000).toFixed(1).replace('.', ',');
            return billions + ' mia.';
        }
        if (num >= 1000000) {
            // Millioner
            const millions = (num / 1000000).toFixed(1).replace('.', ',');
            return millions + ' mio.';
        }
        if (num >= 10000) {
            // Tusinder (kun for tal over 10.000)
            const thousands = Math.round(num / 1000);
            return thousands.toLocaleString('da-DK') + ' tus.';
        }
        return num.toLocaleString('da-DK');
    }

    startCountdownTimer(yearsLeft) {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        const totalSeconds = yearsLeft * 365.25 * 24 * 60 * 60;
        let secondsLeft = totalSeconds;

        // Get individual timer elements
        const yearsEl = document.getElementById('years');
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        this.countdownInterval = setInterval(() => {
            secondsLeft--;

            if (secondsLeft <= 0) {
                clearInterval(this.countdownInterval);
                document.querySelector('.timer-title').textContent = '⏰ Tiden er udløbet';
                [yearsEl, daysEl, hoursEl, minutesEl, secondsEl].forEach(el => {
                    el.textContent = '0';
                });
                return;
            }

            const years = Math.floor(secondsLeft / (365.25 * 24 * 60 * 60));
            const days = Math.floor((secondsLeft % (365.25 * 24 * 60 * 60)) / (24 * 60 * 60));
            const hours = Math.floor((secondsLeft % (24 * 60 * 60)) / (60 * 60));
            const minutes = Math.floor((secondsLeft % (60 * 60)) / 60);
            const seconds = Math.floor(secondsLeft % 60);

            yearsEl.textContent = years.toLocaleString();
            daysEl.textContent = days.toLocaleString();
            hoursEl.textContent = hours;
            minutesEl.textContent = minutes;
            secondsEl.textContent = seconds;
        }, 1000);
    }

    generateShareableUrl() {
        if (!this.resultData) return window.location.origin + window.location.pathname;

        const params = new URLSearchParams();

        // Add calculation parameters
        params.set('age', Math.round(this.resultData.age));
        params.set('gender', this.resultData.gender);
        params.set('country', this.userLocation?.country || 'World');
        params.set('mode', this.currentMode);

        // Add lifestyle factors if in advanced mode
        if (this.currentMode === 'advanced') {
            params.set('lifestyle', Object.values(this.lifestyleFactors).join(','));
        }

        // Add result data for display
        params.set('yearsLeft', Math.round(this.resultData.yearsLeft * 10) / 10);
        params.set('lifeExpectancy', this.resultData.lifeExpectancy);

        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    }

    shareResults() {
        if (!this.resultData) return;

        // Track sharing event
        if (typeof window.plausible === 'function') {
            window.plausible('Results Shared', {
                props: {
                    mode: this.currentMode,
                    share_method: navigator.share ? 'web_share_api' : 'fallback'
                }
            });
        }

        const shareUrl = this.generateShareableUrl();
        const shareText = `🕰️ Jeg har ${Math.round(this.resultData.yearsLeft)} år tilbage at leve ifølge Levetidsberegneren! Hvad med dig? Tjek det her:`;

        if (navigator.share) {
            navigator.share({
                title: 'Levetidsberegner - Mine resultater',
                text: shareText,
                url: shareUrl
            });
        } else {
            // Fallback for browsers without Web Share API
            const fullText = `${shareText} ${shareUrl}`;
            navigator.clipboard.writeText(fullText).then(() => {
                const shareBtn = document.getElementById('shareBtn');
                const originalText = shareBtn.textContent;
                shareBtn.textContent = '✅ Kopieret!';
                setTimeout(() => {
                    shareBtn.textContent = originalText;
                }, 2000);
            }).catch(() => {
                // Manual fallback
                const textArea = document.createElement('textarea');
                textArea.value = fullText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Resultatet er kopieret til udklipsholderen!');
            });
        }
    }

    checkUrlParameters() {
        const params = new URLSearchParams(window.location.search);

        if (!params.has('age')) return; // No shared calculation to load

        // Load shared parameters
        const sharedAge = params.get('age');
        const sharedGender = params.get('gender');
        const sharedCountry = params.get('country');
        const sharedMode = params.get('mode');
        const sharedYearsLeft = params.get('yearsLeft');
        const sharedLifeExpectancy = params.get('lifeExpectancy');

        // Display a notification about shared result
        this.showSharedNotification(sharedAge, sharedGender, sharedYearsLeft);

        // Pre-fill the form
        setTimeout(() => {
            if (sharedAge) {
                const ageInput = document.getElementById('age');
                if (ageInput) ageInput.value = sharedAge;
            }

            if (sharedGender) {
                this.selectGenderByValue(sharedGender);
            }

            if (sharedMode) {
                this.selectMode(sharedMode);
            }

            if (sharedMode === 'advanced' && params.has('lifestyle')) {
                const lifestyleValues = params.get('lifestyle').split(',').map(Number);
                const factorKeys = Object.keys(this.lifestyleFactors);
                lifestyleValues.forEach((value, index) => {
                    if (factorKeys[index]) {
                        this.lifestyleFactors[factorKeys[index]] = value;
                    }
                });
            }

            // Clean URL after loading
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
    }

    showSharedNotification(age, gender, yearsLeft) {
        const genderText = gender === 'male' ? 'mand' : 'kvinde';
        const notification = document.createElement('div');
        notification.className = 'shared-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🔗</span>
                <div>
                    <strong>Delt beregning indlæst!</strong><br>
                    En ${age}-årig ${genderText} har ${yearsLeft} år tilbage at leve.
                    <br><small>Prøv din egen beregning nedenfor!</small>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Add close functionality
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after 8 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 8000);
    }

    selectGenderByValue(gender) {
        const genderButton = document.querySelector(`.gender-btn[data-gender="${gender}"]`);
        if (genderButton) {
            this.selectGender(genderButton);
        }
    }

    resetCalculation() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        const resultsSection = document.getElementById('results');
        const formSection = document.querySelector('.form-section');

        resultsSection.classList.remove('show');
        setTimeout(() => {
            resultsSection.style.display = 'none';
            formSection.style.display = 'block';
            formSection.classList.remove('hidden');
        }, 300);

        // Reset form
        document.getElementById('lifespanForm').reset();

        // Reset gender button selection
        const genderButtons = document.querySelectorAll('.gender-btn');
        genderButtons.forEach(button => {
            button.classList.remove('selected');
        });

        // Reset location section if needed
        const locationSection = document.querySelector('.location-section');
        if (!this.userLocation || this.userLocation.country === 'World') {
            locationSection.style.display = 'block';
            const btn = document.getElementById('getLocationBtn');
            btn.textContent = 'Find min lokation manuelt';
            btn.disabled = false;
        }

        this.userLocation = null;
        this.lifeExpectancyForLocation = null;
        this.updateCalculateButtonState();

        // Try auto-location detection again
        this.tryAutoLocationDetection();

        // Reset timer title
        document.querySelector('.timer-title').textContent = 'Din resterende tid';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Helper function for analytics age groups
    getAgeGroupForAnalytics(age) {
        if (age < 18) return '0-17';
        if (age < 25) return '18-24';
        if (age < 35) return '25-34';
        if (age < 45) return '35-44';
        if (age < 55) return '45-54';
        if (age < 65) return '55-64';
        if (age < 75) return '65-74';
        return '75+';
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

// Initialize the calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new LifespanCalculator();
});

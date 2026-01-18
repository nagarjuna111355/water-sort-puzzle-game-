let gameState = {
    level: 1,
    moves: 0,
    selectedBottle: null,
    bottles: [],
    moveHistory: [],
    colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00'],
    lastPlayedLevel: 1,
    highScores: {},
    profile: {
        name: 'Player',
        level: 1,
        totalStars: 0,
        gamesPlayed: 0
    },
    settings: {
        sound: true,
        vibration: true,
        theme: 'default',
        infinitySkips: false,
        soundVolume: 50,
        vibrationIntensity: 'medium',
        autoSave: true,
        difficulty: 'normal'
    },
    timer: {
        seconds: 0,
        minutes: 0,
        isRunning: false,
        interval: null
    },
    skipsAvailable: 3,
    skipsUsed: 0
};

// Initialize Game
function initGame() {
    console.log('Initializing game...');
    
    // Update last played level when starting a new level
    gameState.lastPlayedLevel = gameState.level;
    
    createBottles();
    updateUI();
    gameState.moves = 0;
    gameState.moveHistory = [];
    resetTimer();
    startTimer(); // Start timer when game initializes
    
    // Update UI elements that depend on settings
    if (typeof updateSkipButton === 'function') {
        updateSkipButton();
    }
    
    // Save game state to persist lastPlayedLevel
    saveGame();
}

function showGame() {
    // Hide completion overlay if visible
    const completionOverlay = document.getElementById('completionOverlay');
    if (completionOverlay && !completionOverlay.classList.contains('hidden')) {
        completionOverlay.classList.add('hidden');
        
        // Re-enable bottle interactions
        const bottles = document.querySelectorAll('.bottle');
        bottles.forEach(bottle => {
            bottle.style.pointerEvents = 'auto';
        });
    }
    
    console.log('Showing game...');
    const homePage = document.getElementById('homePage');
    const gameContainer = document.getElementById('gameContainer');
    const levelSelectionPage = document.getElementById('levelSelectionPage');
    
    if (!homePage || !gameContainer) {
        console.error('Required elements not found');
        return;
    }

    // Hide both home and level selection pages
    homePage.classList.add('hidden');
    if (levelSelectionPage) {
        levelSelectionPage.classList.add('hidden');
    } else {
        // If level selection page exists as a dynamically created element, try to find and remove it
        const dynamicLevelSelection = document.querySelector('.level-selection-page');
        if (dynamicLevelSelection) {
            dynamicLevelSelection.classList.add('hidden');
        }
    }
    
    // Show game container
    gameContainer.classList.remove('hidden');
    initGame();
    
    // Update skip button to reflect current settings
    updateSkipButton();
}

function showHome() {
    // Hide completion overlay if visible
    const completionOverlay = document.getElementById('completionOverlay');
    if (completionOverlay && !completionOverlay.classList.contains('hidden')) {
        completionOverlay.classList.add('hidden');
        
        // Re-enable bottle interactions
        const bottles = document.querySelectorAll('.bottle');
        bottles.forEach(bottle => {
            bottle.style.pointerEvents = 'auto';
        });
    }
    
    console.log('Showing home...');
    const homePage = document.getElementById('homePage');
    const gameContainer = document.getElementById('gameContainer');
    const levelSelectionPage = document.getElementById('levelSelectionPage');
    
    if (!homePage) {
        console.error('Home page not found');
        return;
    }

    // Remove level selection page if it exists
    if (levelSelectionPage) {
        levelSelectionPage.remove();
    } else {
        // Also try to remove any dynamically created level selection page
        const dynamicLevelSelection = document.querySelector('.level-selection-page');
        if (dynamicLevelSelection) {
            dynamicLevelSelection.remove();
        }
    }

    // Hide game container and show home page
    if (gameContainer) {
        gameContainer.classList.add('hidden');
        stopTimer(); // Stop timer when returning to home
    }
    homePage.classList.remove('hidden');
    
    // No background music to stop
    
    // Save game state
    saveGame();
}

function showLevelSelection() {
    // Hide completion overlay if visible
    const completionOverlay = document.getElementById('completionOverlay');
    if (completionOverlay && !completionOverlay.classList.contains('hidden')) {
        completionOverlay.classList.add('hidden');
        
        // Re-enable bottle interactions
        const bottles = document.querySelectorAll('.bottle');
        bottles.forEach(bottle => {
            bottle.style.pointerEvents = 'auto';
        });
    }
    
    console.log('Showing level selection...');
    const homePage = document.getElementById('homePage');
    
    // Remove any existing level selection page before creating a new one
    const existingLevelSelection = document.getElementById('levelSelectionPage') || document.querySelector('.level-selection-page');
    if (existingLevelSelection) {
        existingLevelSelection.remove();
    }
    
    const levelSelectionPage = document.createElement('div');
    levelSelectionPage.id = 'levelSelectionPage';
    levelSelectionPage.className = 'level-selection-page';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'level-selection-header';
    header.innerHTML = `
        <button class="back-btn" onclick="showHome()">
            <i class="fas fa-arrow-left"></i> Back
        </button>
        <h2>Select Level</h2>
        <div class="player-stats">
            <span>Total Stars: ${gameState.profile.totalStars} ⭐</span>
            <span>Highest Level: ${gameState.profile.level}</span>
        </div>
    `;
    
    // Create level grid
    const levelGrid = document.createElement('div');
    levelGrid.className = 'level-grid';
    
    // Generate infinite levels (show next 50 levels from player's current level)
    const startLevel = Math.max(1, gameState.profile.level - 100);
    const endLevel = startLevel + 49;
    
    for (let i = startLevel; i <= endLevel; i++) {
        const levelData = gameState.highScores[i] || null;
        const isLocked = i > gameState.profile.level + 1; // Allow one level ahead
        const levelBox = document.createElement('div');
        levelBox.className = `level-box ${isLocked ? 'locked' : ''} ${i === gameState.lastPlayedLevel ? 'last-played' : ''}`;
        
        if (isLocked) {
            levelBox.innerHTML = `
                <div class="level-content">
                    <span class="level-number">${i}</span>
                    <i class="fas fa-lock"></i>
                </div>
            `;
        } else {
            levelBox.innerHTML = `
                <div class="level-content">
                    <span class="level-number">${i}</span>
                    ${levelData ? `
                        ${levelData.skipped ? `
                            <div class="stars">
                                <span style="color: #888; font-size: 14px;">SKIPPED</span>
                            </div>
                        ` : `
                            <div class="stars">${'⭐'.repeat(levelData.stars)}</div>
                        `}
                        <div class="level-stats">
                            <small>Moves: ${levelData.moves}</small>
                            <small>Time: ${Math.floor(levelData.time / 60)}:${String(levelData.time % 60).padStart(2, '0')}</small>
                        </div>
                    ` : '<div class="stars">New</div>'}
                </div>
            `;
            
            levelBox.onclick = () => {
                gameState.level = i;
                showGame();
            };
        }
        if (isLocked) {
            levelBox.innerHTML = `
                <div class="level-content">
                    <span class="level-number">${i}</span>
                    <i class="fas fa-lock"></i>
                </div>
            `;
            levelBox.style.cursor = 'default';
            levelBox.style.pointerEvents = 'none';
        }
        
        levelGrid.appendChild(levelBox);
    }
    
    // Create infinite scroll trigger
    const loadMoreTrigger = document.createElement('div');
    loadMoreTrigger.className = 'load-more-trigger';
    loadMoreTrigger.innerHTML = '<div class="loading-spinner"></div>';
    
    // Add components to page
    levelSelectionPage.appendChild(header);
    levelSelectionPage.appendChild(levelGrid);
    levelSelectionPage.appendChild(loadMoreTrigger);
    
    // Replace home page with level selection
    homePage.classList.add('hidden');
    document.body.appendChild(levelSelectionPage);
    
    // Implement infinite scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Load more levels
                const currentLevels = levelGrid.children.length;
                const nextStartLevel = startLevel + currentLevels;
                const nextEndLevel = nextStartLevel + 24;
                
                for (let i = nextStartLevel; i <= nextEndLevel; i++) {
                    const levelData = gameState.highScores[i] || null;
                    const isLocked = i > gameState.profile.level + 1;
                    const levelBox = document.createElement('div');
                    levelBox.className = `level-box ${isLocked ? 'locked' : ''}`;
                    
                    if (isLocked) {
                        levelBox.innerHTML = `
                            <div class="level-content">
                                <span class="level-number">${i}</span>
                                <i class="fas fa-lock"></i>
                            </div>
                        `;
                    } else {
                        levelBox.innerHTML = `
                            <div class="level-content">
                                <span class="level-number">${i}</span>
                                ${levelData ? `
                                    ${levelData.skipped ? `
                                        <div class="stars">
                                            <span style="color: #888; font-size: 14px;">SKIPPED</span>
                                        </div>
                                    ` : `
                                        <div class="stars">${'⭐'.repeat(levelData.stars)}</div>
                                    `}
                                    <div class="level-stats">
                                        <small>Moves: ${levelData.moves}</small>
                                        <small>Time: ${Math.floor(levelData.time / 60)}:${String(levelData.time % 60).padStart(2, '0')}</small>
                                    </div>
                                ` : '<div class="stars">New</div>'}
                            </div>
                        `;
                        
                        levelBox.onclick = () => {
                            gameState.level = i;
                            showGame();
                        };
                    }
                    
                    levelGrid.appendChild(levelBox);
                }
            }
        });
    }, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    });
    
    observer.observe(loadMoreTrigger);
}

// Create Bottles
function createBottles() {
    console.log('Creating bottles with colors:', gameState.colors);
    gameState.bottles = [];
    const numBottles = 8; // 6 filled bottles + 2 empty
    const bottleHeight = 4;
    const numColors = 6; // Number of different colors

    // Create segments for each color (4 segments per color)
    let segments = [];
    for (let color = 0; color < numColors; color++) {
        for (let i = 0; i < bottleHeight; i++) {
            segments.push(gameState.colors[color]);
            console.log('Adding color segment:', gameState.colors[color]);
        }
    }
    
    // Shuffle the segments
    segments = shuffleArray([...segments]); // Create a copy before shuffling
    console.log('Shuffled segments:', segments);
    
    // Create filled bottles
    for (let i = 0; i < numColors; i++) {
        let bottle = [];
        for (let j = 0; j < bottleHeight; j++) {
            const index = i * bottleHeight + j;
            if (index < segments.length) {
                bottle.unshift(segments[index]); // Add to start of array (bottom of bottle)
                console.log('Adding to bottle', i, 'segment', j, ':', segments[index]);
            }
        }
        gameState.bottles.push(bottle);
        console.log('Bottle', i, 'contents:', bottle);
    }
    
    // Add empty bottles
    gameState.bottles.push([]);
    gameState.bottles.push([]);
    
    console.log('Final bottles state:', gameState.bottles);
    updateBottles();
}

// Update Bottles Display
function updateBottles() {
    console.log('Updating bottles...', gameState.bottles);
    const container = document.querySelector('.bottles-container');
    if (!container) {
        console.error('Bottles container not found!');
        return;
    }

    container.innerHTML = '';
    
    gameState.bottles.forEach((bottle, index) => {
        console.log('Creating bottle', index, 'with contents:', bottle);
        const bottleDiv = document.createElement('div');
        bottleDiv.className = 'bottle';
        bottleDiv.onclick = () => selectBottle(index);
        
        // Create the bottle structure
        const bottleContent = document.createElement('div');
        bottleContent.className = 'bottle-content';
        
        // Add water sections considering flex-direction: column-reverse
        // With column-reverse, first element added appears at the visual bottom
        for (let position = 0; position < 4; position++) {
            const section = document.createElement('div');
            section.className = 'water-section';
            section.style.height = '25%';
            
            // Check if this position in the bottle has liquid
            if (position < bottle.length) {
                // Position 0 is bottom, so we take from the beginning of the bottle array
                const color = bottle[position];
                section.style.backgroundColor = color;
                section.style.opacity = '1';
                // Ensure the color is visible
                section.style.visibility = 'visible';
                console.log('Bottle', index, 'Position', position, '- Setting color:', color);
            } else {
                section.style.backgroundColor = 'transparent';
                section.style.opacity = '0';
                section.style.visibility = 'hidden';
                console.log('Bottle', index, 'Position', position, '- Setting transparent');
            }
            
            section.style.transition = 'all 0.3s ease';
            section.style.border = 'none';
            section.style.position = 'relative';
            section.style.zIndex = '10';
            
            bottleContent.appendChild(section);
        }
        
        bottleDiv.appendChild(bottleContent);
        container.appendChild(bottleDiv);
    });
    console.log('Finished updating bottles');
}

// Handle Bottle Selection
function selectBottle(index) {
    console.log('Selecting bottle:', index);
    
    if (gameState.selectedBottle === null) {
        // First bottle selection
        if (gameState.bottles[index].length > 0) {
            gameState.selectedBottle = index;
            document.querySelectorAll('.bottle')[index].classList.add('selected');
            console.log('Selected source bottle:', index);
        }
    } else {
        // Second bottle selection
        const fromIndex = gameState.selectedBottle;
        const toIndex = index;
        
        console.log('Attempting to pour from bottle', fromIndex, 'to bottle', toIndex);
        
        if (fromIndex !== toIndex) {
            if (canPour(fromIndex, toIndex)) {
                pour(fromIndex, toIndex);
                gameState.moves++;
                updateUI();
                checkWin();
            } else {
                console.log('Cannot pour between these bottles');
            }
        }
        
        // Deselect the first bottle
        document.querySelectorAll('.bottle')[fromIndex].classList.remove('selected');
        gameState.selectedBottle = null;
    }
}

// Check if Pour is Valid
function canPour(from, to) {
    const fromBottle = gameState.bottles[from];
    const toBottle = gameState.bottles[to];
    
    // Debug logging
    console.log('Checking if can pour:', {
        fromBottle,
        toBottle,
        fromLength: fromBottle.length,
        toLength: toBottle.length
    });
    
    // Check if source bottle is empty
    if (fromBottle.length === 0) {
        console.log('Source bottle is empty');
        return false;
    }
    
    // Check if destination bottle is full
    if (toBottle.length >= 4) {
        console.log('Destination bottle is full');
        return false;
    }
    
    const sourceColor = fromBottle[fromBottle.length - 1];
    
    // If destination is empty, pouring is allowed
    if (toBottle.length === 0) {
        console.log('Destination is empty, can pour');
        return true;
    }
    
    const destColor = toBottle[toBottle.length - 1];
    
    // Check if colors match
    const colorsMatch = sourceColor === destColor;
    console.log('Colors match:', colorsMatch, 'Source:', sourceColor, 'Dest:', destColor);
    
    return colorsMatch;
}

// Pour Water Between Bottles
function pour(from, to) {
    const fromBottle = gameState.bottles[from];
    const toBottle = gameState.bottles[to];
    
    // Save current state for undo
    gameState.moveHistory.push({
        from: from,
        to: to,
        bottles: JSON.parse(JSON.stringify(gameState.bottles))
    });
    
    // Get the color to pour
    const colorToPour = fromBottle[fromBottle.length - 1];
    let pourCount = 0;
    
    // Pour while conditions are met
    while (fromBottle.length > 0 && 
           toBottle.length < 4 && 
           fromBottle[fromBottle.length - 1] === colorToPour) {
        const color = fromBottle.pop();
        toBottle.push(color);
        pourCount++;
    }
    
    console.log(`Poured ${pourCount} units of color ${colorToPour}`);

    // Update the display with animation
    updateBottles();
    
    // Add pouring animation class
    const bottles = document.querySelectorAll('.bottle');
    if (bottles[to]) {
        const sections = bottles[to].querySelectorAll('.water-section');
        sections.forEach(section => {
            if (section.style.backgroundColor === colorToPour) {
                section.classList.add('pouring');
                setTimeout(() => section.classList.remove('pouring'), 500);
            }
        });
    }
}

// Show non-blocking message
function showMessage(message) {
    // Remove any existing message
    const existingMessage = document.querySelector('.message-overlay');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = 'message-overlay';
    messageEl.innerHTML = `
        <div class="message-box">
            <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
            <button class="message-close">OK</button>
        </div>
    `;

    // Add to body
    document.body.appendChild(messageEl);

    // Add close button handler
    const closeButton = messageEl.querySelector('.message-close');
    closeButton.addEventListener('click', () => {
        messageEl.remove();
    });

    // Auto-close after 3 seconds
    setTimeout(() => {
        if (document.body.contains(messageEl)) {
            messageEl.remove();
        }
    }, 3000);

    return messageEl;
}

// Check Win Condition
function checkWin() {
    console.log('checkWin function called');
    const win = gameState.bottles.every(bottle => {
        // Empty bottle is valid
        if (bottle.length === 0) {
            return true;
        }
        
        // Check if bottle is full and all colors match
        if (bottle.length === 4) {
            const firstColor = bottle[0];
            console.log('Checking bottle with first color:', firstColor);
            const allMatch = bottle.every(color => color === firstColor);
            console.log('All colors match:', allMatch, 'bottle contents:', bottle);
            return allMatch;
        }
        
        // Partially filled bottle means not won
        console.log('Partially filled bottle, not won');
        return false;
    });
    
    console.log('Win condition result:', win);
    
    if (win) {
        console.log('Game is won! Processing win...');
        stopTimer(); // Stop timer when level is complete
        const totalSeconds = gameState.timer.minutes * 60 + gameState.timer.seconds;
        
        // Calculate stars based on performance
        let stars = 1; // Base star for completing
        if (gameState.moves <= 10) stars++; // Bonus star for few moves
        if (totalSeconds <= 60) stars++;  // Bonus star for fast completion
        
        // Ensure we don't award more stars than possible
        stars = Math.min(stars, 3);
        
        // Store level completion data
        if (!gameState.highScores[gameState.level]) {
            gameState.highScores[gameState.level] = {
                moves: gameState.moves,
                time: totalSeconds,
                stars: stars,
                date: new Date().toISOString()
            };
        } else {
            // Update if better performance
            const currentScore = gameState.highScores[gameState.level];
            if (gameState.moves < currentScore.moves || totalSeconds < currentScore.time) {
                gameState.highScores[gameState.level] = {
                    moves: gameState.moves,
                    time: totalSeconds,
                    stars: stars,
                    date: new Date().toISOString()
                };
            }
            // If current score doesn't have stars (older save), add them
            else if (typeof currentScore.stars === 'undefined') {
                gameState.highScores[gameState.level].stars = stars;
            }
        }
        
        // Update profile stats
        gameState.profile.totalStars += stars;
        if (gameState.level > gameState.profile.level) {
            gameState.profile.level = gameState.level;
        }
        gameState.profile.gamesPlayed++;
        
        // Update last played level to the next level (since current level is completed)
        gameState.lastPlayedLevel = gameState.level + 1;
        
        // Award a skip every 5 levels
        if (gameState.level % 5 === 0) {
            gameState.skipsAvailable++;
        }
        
        console.log('Level won!', stars, 'stars awarded');
        
        // Play win sound
        if (gameState.settings.sound) {
            audioManager.playSound('levelComplete');
        }
        
        // Save game state before showing completion screen
        saveGame();
        
        console.log('About to show level completion screen');
        
        // Show level completion screen and wait for user interaction
        setTimeout(() => {
            console.log('Calling showLevelCompletion with', stars, totalSeconds);
            // Add extra delay to ensure DOM is ready
            setTimeout(() => {
                showLevelCompletion(stars, totalSeconds);
            }, 100);
            
            // Don't automatically advance - let user choose next action
            console.log('Level completion screen shown - waiting for user interaction');
        }, 600); // Increased delay to ensure everything is ready
        
        return true; // Indicate win condition is met
    }
    return false; // Indicate win condition is not met
}

// Show Level Completion Screen
function showLevelCompletion(stars, totalSeconds) {
    console.log('showLevelCompletion called with stars:', stars, 'and time:', totalSeconds);
    
    // Try to find the overlay element
    let overlay = document.getElementById('completionOverlay');
    
    // If not found immediately, try again after a small delay
    if (!overlay) {
        console.log('Overlay not found immediately, trying again...');
        setTimeout(() => {
            overlay = document.getElementById('completionOverlay');
            if (overlay) {
                console.log('Overlay found on retry');
                showCompletion(overlay, stars, totalSeconds);
            } else {
                console.error('Completion overlay still not found after retry!');
            }
        }, 50);
        return;
    }
    
    console.log('Overlay element found immediately');
    showCompletion(overlay, stars, totalSeconds);
}

// Helper function to actually show the completion
function showCompletion(overlay, stars, totalSeconds) {
    
    const completionText = document.getElementById('completionText');
    const completionMoves = document.getElementById('completionMoves');
    const completionTime = document.getElementById('completionTime');
    const starsDisplay = document.getElementById('starsDisplay');
    
    // Update the content
    if (completionText) completionText.textContent = `Level ${gameState.level} Complete!`;
    if (completionMoves) completionMoves.textContent = `Moves: ${gameState.moves}`;
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (completionTime) completionTime.textContent = `Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Clear previous stars
    if (starsDisplay) {
        starsDisplay.innerHTML = '';
        
        // Add stars based on performance (using simple text stars)
        starsDisplay.textContent = '⭐'.repeat(stars);
    }
    
    // Show the overlay
    overlay.classList.remove('hidden');
    console.log('Completion overlay shown');
}

// Hide Level Completion Screen
function hideLevelCompletion() {
    const overlay = document.getElementById('completionOverlay');
    overlay.classList.add('hidden');
    
    // Re-enable bottle interactions
    const bottles = document.querySelectorAll('.bottle');
    bottles.forEach(bottle => {
        bottle.style.pointerEvents = 'auto';
    });
}

// Try again function
function tryAgain() {
    hideLevelCompletion();
    
    // Reset level-specific state
    gameState.moves = 0;
    gameState.moveHistory = [];
    gameState.selectedBottle = null;
    
    // Reinitialize the same level
    initGame();
}

// Move to next level
function nextLevel() {
    // Hide completion overlay if visible
    const completionOverlay = document.getElementById('completionOverlay');
    if (completionOverlay) {
        completionOverlay.classList.add('hidden');
    }
    
    gameState.level++;
    
    // Make sure we don't exceed maximum level (2000)
    if (gameState.level > 2000) {
        gameState.level = 2000;
        showMessage('Congratulations! You\'ve completed all levels!');
        return;
    }
    
    // Reset level-specific state
    gameState.moves = 0;
    gameState.moveHistory = [];
    gameState.selectedBottle = null;
    
    // Start the next level
    initGame();
}

// Undo Move
function undoMove() {
    if (gameState.moveHistory.length > 0) {
        const lastMove = gameState.moveHistory.pop();
        
        if (lastMove.type === 'add_tube' || lastMove.type === 'delete_tube') {
            gameState.bottles = lastMove.bottles;
        } else {
            gameState.bottles = lastMove.bottles;
            gameState.moves++;
        }
        
        updateBottles();
        updateUI();
    }
}

// Reset Level
function resetLevel() {
    gameState.moveHistory = [];
    gameState.moves = 0;
    resetTimer();
    initGame();
}

// Show Instructions
function showInstructions() {
    // Remove any existing overlays
    const existingOverlays = document.querySelectorAll('.message-overlay, .completion-overlay, .instructions-overlay');
    existingOverlays.forEach(overlay => overlay.remove());
    
    const overlay = document.createElement('div');
    overlay.className = 'instructions-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-family: 'Poppins', sans-serif;
    `;
    
    const instructionsBox = document.createElement('div');
    instructionsBox.style.cssText = `
        text-align: center;
        padding: 40px;
        border-radius: 20px;
        background: linear-gradient(135deg, #3498db, #8e44ad);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    `;
    
    instructionsBox.innerHTML = `
        <h1 style="
            font-size: 32px; 
            margin: 0 0 20px 0; 
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">How to Play Water Sort Puzzle</h1>
        
        <div style="text-align: left; margin-bottom: 25px;">
            <h3 style="color: #FFD700; margin: 15px 0 10px 0;">Objective:</h3>
            <p>Sort the colored water in each test tube so that tubes contain only one color each.</p>
            
            <h3 style="color: #FFD700; margin: 15px 0 10px 0;">Rules:</h3>
            <ol style="text-align: left; margin: 10px 0; padding-left: 20px;">
                <li>Only pour water from one tube to another if the receiving tube is empty or has the same color on top</li>
                <li>You cannot pour water into a full tube</li>
                <li>You cannot pour water onto a tube with a different color on top</li>
                <li>Each tube can hold a maximum of 4 balls of water</li>
            </ol>
            
            <h3 style="color: #FFD700; margin: 15px 0 10px 0;">How to Play:</h3>
            <ol style="text-align: left; margin: 10px 0; padding-left: 20px;">
                <li>Click on a tube to select it (it will highlight)</li>
                <li>Click on another tube to pour water from the selected tube to the destination</li>
                <li>Repeat until all tubes are sorted by color</li>
                <li>Complete the level with as few moves as possible</li>
            </ol>
            
            <h3 style="color: #FFD700; margin: 15px 0 10px 0;">Tips:</h3>
            <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
                <li>Plan your moves ahead to minimize the number of pours</li>
                <li>Try to group same-colored balls together early in the game</li>
                <li>Use empty tubes strategically to temporarily store colors</li>
            </ul>
        </div>
        
        <button id="close-instructions" style="
            padding: 15px 30px;
            background: linear-gradient(to right, #2ecc71, #1abc9c);
            color: white;
            border: none;
            border-radius: 50px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
            transition: all 0.3s ease;
            font-family: 'Poppins', sans-serif;
        ">
            <i class="fas fa-check-circle" style="margin-right: 10px;"></i>Got It!
        </button>
    `;
    
    overlay.appendChild(instructionsBox);
    document.body.appendChild(overlay);
    
    // Add Font Awesome if not already present
    if (!document.querySelector('[href*="fontawesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
    
    // Add event listener to close button
    setTimeout(() => {
        const closeBtn = document.getElementById('close-instructions');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.remove();
            });
        }
    }, 10);
    
    // Close when clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function startLevel(levelNumber) {
    // Initialize the new level
    gameState.level = levelNumber;
    
    // Reinitialize game for the new level
    initGame();
}

// Update Skip Button (placeholder function)
function updateSkipButton() {
    // Placeholder function to prevent errors
    // Can be implemented later if skip button functionality is needed
    console.log('updateSkipButton called');
}

// Update UI Elements
function updateUI() {
    console.log('Updating UI...');
    const levelElement = document.getElementById('level');
    const movesElement = document.getElementById('moves');
    
    if (!levelElement || !movesElement) {
        console.error('UI elements not found');
        return;
    }

    levelElement.textContent = `Level: ${gameState.level}`;

    movesElement.textContent = `Moves: ${gameState.moves}`;

    updateSkipButton();
}

// Save and Load Game
function saveGame() {
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGame() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        gameState = { ...gameState, ...parsedState };
    }
}

// Utility Function to Shuffle Array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}



// Update settings function
function updateSettings() {
    const settings = gameState.settings;
    
    // Update audio manager
    if (audioManager) {
        // Update sound effects volume
        for (let sound in audioManager.sounds) {
            audioManager.sounds[sound].volume = (settings.soundVolume || 50) / 100;
        }
        
        // No music functionality - only sound effects
    }
    
    // Update skip button state
    updateSkipButton();
    
    // Apply vibration settings
    // No need to do anything specific here, vibration is handled when needed
    
    // Note: Don't save here - saveGame() is called separately
}



// Initialize default settings if not present
if (!gameState.settings) {
    gameState.settings = {
        sound: true,
        soundVolume: 50,
        vibration: true,
        vibrationIntensity: 'medium',
        infinitySkips: false,
        autoSave: true,
        difficulty: 'normal'
    };
    saveGame();
}



function showProfile() {
    console.log('Showing profile...');
    const modal = document.createElement('div');
    modal.className = 'modal profile-modal';
    
    // Calculate stats
    const totalLevelsCompleted = Object.keys(gameState.highScores).length;
    
    // Create level completion HTML
    let levelStatsHTML = '<div class="level-stats">';
    Object.entries(gameState.highScores).forEach(([level, data]) => {
        levelStatsHTML += `
            <div class="level-stat-item">
                <h4>Level ${level}</h4>
                <p>${'⭐'.repeat(data.stars)}</p>
                <p>Moves: ${data.moves}</p>
                <p>Time: ${Math.floor(data.time / 60)}:${String(data.time % 60).padStart(2, '0')}</p>
            </div>
        `;
    });
    if (totalLevelsCompleted === 0) {
        levelStatsHTML += '<p>No levels completed yet. Start playing to see your progress here!</p>';
    }
    levelStatsHTML += '</div>';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Player Profile</h2>
            <div class="profile-info">
                <div class="avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h3>${gameState.profile.name}</h3>
                <div class="stats">
                    <p>Current Level: ${gameState.profile.level}</p>
                    <p>Total Stars: ${gameState.profile.totalStars} ⭐</p>
                    <p>Games Played: ${gameState.profile.gamesPlayed}</p>
                    <p>Levels Completed: ${totalLevelsCompleted}</p>
                    <p>Skips Available: ${gameState.skipsAvailable}</p>
                    <p>Skips Used: ${gameState.skipsUsed}</p>
                </div>
                <h3 class="level-stats-title">Level Completion</h3>
                ${levelStatsHTML}
            </div>
            <div class="profile-actions">
                <button class="edit-profile-btn">Edit Profile</button>
                <button class="reset-stats-btn">Reset Stats</button>
                <button class="close-btn">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners for profile actions
    modal.querySelector('.close-btn').onclick = () => modal.remove();
    
    // Edit profile button
    const editBtn = modal.querySelector('.edit-profile-btn');
    if (editBtn) {
        editBtn.onclick = () => {
            // Create a profile editor modal
            const editorModal = document.createElement('div');
            editorModal.className = 'modal profile-editor-modal';
            editorModal.innerHTML = `
                <div class="modal-content">
                    <h2>Edit Profile</h2>
                    <div class="avatar-container">
                        <div class="current-avatar">
                            <i class="fas fa-user-circle" style="font-size: 5rem; color: var(--primary-color);"></i>
                        </div>
                        <p>Change your avatar coming soon...</p>
                    </div>
                    <div class="form-group">
                        <label for="profileName">Player Name:</label>
                        <input type="text" id="profileName" value="${gameState.profile.name}" maxlength="20" placeholder="Enter your name">
                        <small id="nameCounter">${gameState.profile.name.length}/20 characters</small>
                    </div>
                    <div class="editor-buttons">
                        <button class="save-profile-btn">Save</button>
                        <button class="cancel-profile-btn">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(editorModal);
            
            const nameInput = editorModal.querySelector('#profileName');
            const nameCounter = editorModal.querySelector('#nameCounter');
            const saveBtn = editorModal.querySelector('.save-profile-btn');
            const cancelBtn = editorModal.querySelector('.cancel-profile-btn');
            
            // Update character counter
            nameInput.addEventListener('input', () => {
                const currentLength = nameInput.value.length;
                nameCounter.textContent = `${currentLength}/20 characters`;
                
                // Change color if approaching limit
                if (currentLength > 18) {
                    nameCounter.style.color = '#f44336';
                } else {
                    nameCounter.style.color = 'inherit';
                }
            });
            
            // Save button
            saveBtn.onclick = () => {
                const newName = nameInput.value.trim();
                
                if (newName === '') {
                    alert('Name cannot be empty!');
                    return;
                }
                
                if (newName.length < 2) {
                    alert('Name must be at least 2 characters long!');
                    return;
                }
                
                gameState.profile.name = newName;
                saveGame();
                
                // Show success message
                const successNotification = document.createElement('div');
                successNotification.className = 'edit-success-notification';
                successNotification.textContent = 'Profile updated successfully!';
                document.body.appendChild(successNotification);
                
                setTimeout(() => {
                    successNotification.remove();
                    editorModal.remove();
                    modal.remove();
                    showProfile(); // Refresh profile with new name
                }, 1500);
            };
            
            // Cancel button
            cancelBtn.onclick = () => {
                editorModal.remove();
            };
            
            // Allow Enter key to save
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveBtn.click();
                }
            });
        };
    }
    
    // Reset stats button
    const resetBtn = modal.querySelector('.reset-stats-btn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            // Show a custom confirmation modal instead of the basic confirm
            const confirmationModal = document.createElement('div');
            confirmationModal.className = 'modal confirmation-modal';
            confirmationModal.innerHTML = `
                <div class="modal-content">
                    <h3>Confirm Reset</h3>
                    <p>⚠️ <strong>This action cannot be undone!</strong></p>
                    <p>You will lose:</p>
                    <ul>
                        <li>All your level completions</li>
                        <li>All your stars</li>
                        <li>Your game progress</li>
                        <li>Your current streak</li>
                    </ul>
                    <p>Type "RESET" to confirm:</p>
                    <input type="text" id="confirm-reset-input" placeholder="Type RESET">
                    <div class="confirmation-actions">
                        <button class="confirm-reset-btn" disabled>Reset Stats</button>
                        <button class="cancel-reset-btn">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmationModal);
            
            const confirmInput = confirmationModal.querySelector('#confirm-reset-input');
            const confirmBtn = confirmationModal.querySelector('.confirm-reset-btn');
            const cancelBtn = confirmationModal.querySelector('.cancel-reset-btn');
            
            confirmInput.addEventListener('input', (e) => {
                confirmBtn.disabled = e.target.value.toUpperCase() !== 'RESET';
            });
            
            confirmBtn.onclick = () => {
                // Reset profile stats
                gameState.profile = {
                    name: gameState.profile.name, // Keep the name
                    level: 1,
                    totalStars: 0,
                    gamesPlayed: 0
                };
                
                // Reset other stats
                gameState.skipsAvailable = 3;
                gameState.skipsUsed = 0;
                gameState.highScores = {};
                
                saveGame();
                
                // Show success message
                const successNotification = document.createElement('div');
                successNotification.className = 'reset-success-notification';
                successNotification.textContent = 'Stats successfully reset!';
                document.body.appendChild(successNotification);
                
                setTimeout(() => {
                    successNotification.remove();
                    confirmationModal.remove();
                    modal.remove();
                    showProfile(); // Refresh profile with reset stats
                }, 1500);
            };
            
            cancelBtn.onclick = () => {
                confirmationModal.remove();
            };
        };
    }
}

// Add new functions for tube management
function addNewTube() {
    if (gameState.bottles.length >= 12) return; // Maximum 12 tubes
    
    // Add an empty tube
    gameState.bottles.push([]);
    
    // Save state for undo
    gameState.moveHistory.push({
        type: 'add_tube',
        bottles: JSON.parse(JSON.stringify(gameState.bottles))
    });
    
    updateBottles();
    updateUI();
}

function deleteTube() {
    if (gameState.bottles.length <= 3) return; // Minimum 3 tubes
    
    // Find the last empty tube
    let lastEmptyIndex = -1;
    for (let i = gameState.bottles.length - 1; i >= 0; i--) {
        if (gameState.bottles[i].length === 0) {
            lastEmptyIndex = i;
            break;
        }
    }
    
    if (lastEmptyIndex === -1) {
        alert('Can only delete empty tubes!');
        return;
    }
    
    // Save state for undo
    gameState.moveHistory.push({
        type: 'delete_tube',
        bottles: JSON.parse(JSON.stringify(gameState.bottles)),
        deletedIndex: lastEmptyIndex
    });
    
    // Remove the tube
    gameState.bottles.splice(lastEmptyIndex, 1);
    
    updateBottles();
    updateUI();
}

// Add timer functions
function startTimer() {
    if (!gameState.timer.isRunning) {
        gameState.timer.isRunning = true;
        gameState.timer.interval = setInterval(updateTimer, 1000);
    }
}

function stopTimer() {
    if (gameState.timer.isRunning) {
        gameState.timer.isRunning = false;
        clearInterval(gameState.timer.interval);
    }
}

function resetTimer() {
    stopTimer();
    gameState.timer.seconds = 0;
    gameState.timer.minutes = 0;
    updateTimerDisplay();
}

function updateTimer() {
    gameState.timer.seconds++;
    if (gameState.timer.seconds >= 60) {
        gameState.timer.seconds = 0;
        gameState.timer.minutes++;
    }
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        const minutes = String(gameState.timer.minutes).padStart(2, '0');
        const seconds = String(gameState.timer.seconds).padStart(2, '0');
        timerElement.textContent = `Time: ${minutes}:${seconds}`;
    }
}

// Add skipLevel function
function skipLevel() {
    // If infinity skips are enabled, skip directly without checks
    if (gameState.settings.infinitySkips) {
        // Skip the level without decrementing skips
        skipCurrentLevel();
        return;
    }
    
    // If infinity skips are disabled, check if user has available skips
    if (gameState.skipsAvailable <= 0) {
        // Option to enable infinity skips
        if (confirm('No skips available! Would you like to enable Infinity Skips?')) {
            toggleInfinitySkips();
            skipCurrentLevel();
        } else {
            showSettings(); // Show settings directly so user can enable infinity skips
        }
        return;
    }

    // Regular skip with confirmation
    const confirmMessage = `Skip this level? (${gameState.skipsAvailable} skip(s) remaining)`;

    if (confirm(confirmMessage)) {
        skipCurrentLevel();
    }
}

// Function to skip the current level
function skipCurrentLevel() {
    // Record the skipped level in high scores with 0 stars to indicate it was skipped
    gameState.highScores[gameState.level] = {
        moves: gameState.moves,
        time: gameState.timer.minutes * 60 + gameState.timer.seconds,
        stars: 0, // 0 stars indicates the level was skipped
        date: new Date().toISOString(),
        skipped: true
    };
    
    // Only decrement skips if infinity skips is not enabled
    if (!gameState.settings.infinitySkips) {
        gameState.skipsAvailable--;
    }
    
    gameState.skipsUsed++;
    gameState.level++;
    gameState.lastPlayedLevel = gameState.level;
    saveGame();
    initGame();
    
    // Show feedback message
    const message = gameState.settings.infinitySkips ? 
        'Level skipped! (Infinity Skips enabled)' : 
        `Level skipped! (${gameState.skipsAvailable} skips remaining)`;
    showMessage(message);
    
    updateSkipButton();
}

// Long press to toggle infinity skips
let longPressTimer = null;
let isLongPress = false;

// Initialize skip button with long press functionality
function initSkipButton() {
    const skipBtn = document.querySelector('.skip-btn');
    if (skipBtn) {
        // Touch events for mobile
        skipBtn.addEventListener('touchstart', function(e) {
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                toggleInfinitySkips();
            }, 1000); // 1 second long press
        });
        
        skipBtn.addEventListener('touchend', function(e) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            if (!isLongPress) {
                // Short tap - regular skip
                skipLevel();
            }
        });
        
        skipBtn.addEventListener('touchcancel', function(e) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });
        
        // Mouse events for desktop
        skipBtn.addEventListener('mousedown', function(e) {
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                toggleInfinitySkips();
            }, 1000); // 1 second long press
        });
        
        skipBtn.addEventListener('mouseup', function(e) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            if (!isLongPress) {
                // Short click - regular skip
                skipLevel();
            }
        });
        
        skipBtn.addEventListener('mouseleave', function(e) {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });
    }
}

// Toggle Infinity Skips
function toggleInfinitySkips() {
    // If infinity skips are currently enabled, skip the level
    if (gameState.settings.infinitySkips) {
        skipCurrentLevel();
    } else {
        // Otherwise, enable infinity skips
        gameState.settings.infinitySkips = true;
        updateInfinitySkipButton();
        
        // Show feedback to the user
        showMessage('Infinity Skips enabled! 🎉 You can now skip levels freely!');
        
        // Save the updated settings
        saveGame();
    }
}

// Update the infinity skip button appearance
function updateInfinitySkipButton() {
    const infinitySkipBtn = document.querySelector('.infinity-skip-btn');
    if (infinitySkipBtn) {
        if (gameState.settings.infinitySkips) {
            infinitySkipBtn.innerHTML = `<i class="fas fa-infinity"></i> ∞ Skip!`;
            infinitySkipBtn.style.background = '#9b59b6'; // Purple color for active
            infinitySkipBtn.title = 'Skip this level (Infinity Skips enabled!)';
        } else {
            infinitySkipBtn.innerHTML = `<i class="fas fa-infinity"></i> ∞ Enable`;
            infinitySkipBtn.style.background = '#7f8c8d'; // Grey color for inactive
            infinitySkipBtn.title = 'Click to enable Infinity Skips';
        }
    }
}

// Show non-blocking message
function showMessage(message) {
    // Remove any existing message
    const existingMessage = document.querySelector('.message-overlay');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = 'message-overlay';
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 30px;
        z-index: 3000;
        font-family: 'Poppins', sans-serif;
        font-size: 16px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        animation: fadeInOut 3s ease-in-out forwards;
    `;
    
    // Add animation CSS if not already present
    if (!document.querySelector('#fadeInOutCSS')) {
        const style = document.createElement('style');
        style.id = 'fadeInOutCSS';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; top: 0; }
                10% { opacity: 1; top: 20px; }
                90% { opacity: 1; top: 20px; }
                100% { opacity: 0; top: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageEl);
    
    // Remove the message after animation completes
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Update the infinity skip button appearance
function updateInfinitySkipButton() {
    const infinitySkipBtn = document.querySelector('.infinity-skip-btn');
    if (infinitySkipBtn) {
        if (gameState.settings.infinitySkips) {
            infinitySkipBtn.innerHTML = `<i class="fas fa-infinity"></i> ∞ Skip!`;
            infinitySkipBtn.style.background = '#9b59b6'; // Purple color for active
            infinitySkipBtn.title = 'Skip this level (Infinity Skips enabled!)';
        } else {
            infinitySkipBtn.innerHTML = `<i class="fas fa-infinity"></i> ∞ Enable`;
            infinitySkipBtn.style.background = '#7f8c8d'; // Grey color for inactive
            infinitySkipBtn.title = 'Click to enable Infinity Skips';
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Load saved game
    loadGame();
    
    // Initialize game container as hidden
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        gameContainer.classList.add('hidden');
    }
    
    // Ensure completion overlay is hidden initially
    const completionOverlay = document.getElementById('completionOverlay');
    console.log('Completion overlay on load:', !!completionOverlay);
    if (completionOverlay) {
        completionOverlay.classList.add('hidden');
        console.log('Completion overlay initialized and hidden');
    } else {
        console.error('Completion overlay NOT FOUND on page load!');
    }
    
    // Set up button event listeners with delegation to handle dynamic elements
    setupButtonEventListeners();
    
    // Update infinity skip button to reflect current settings
    if (typeof updateInfinitySkipButton === 'function') {
        updateInfinitySkipButton();
    }
    
    
    
});


// Function to set up button event listeners
function setupButtonEventListeners() {
    // Use event delegation for better reliability
    document.addEventListener('click', function(e) {
        // Play button
        if (e.target.closest('.play-button')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Play button clicked');
            showLevelSelection();
        }
        // Continue button
        else if (e.target.closest('.continue-button')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Continue button clicked');
            gameState.level = gameState.lastPlayedLevel;
            showGame();
        }

        // Profile button
        else if (e.target.closest('.profile-btn')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Profile button clicked');
            showProfile();
        }
        
        // Instructions button
        else if (e.target.closest('.instructions-button')) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Instructions button clicked');
            showInstructions();
        }
    });
    
    // Initialize audio context on first user interaction
    document.addEventListener('click', function() {
        if (audioManager && typeof audioManager.initializeAudioContext === 'function') {
            audioManager.initializeAudioContext();
        }
    }, { once: true });
    
    document.addEventListener('touchstart', function() {
        if (audioManager && typeof audioManager.initializeAudioContext === 'function') {
            audioManager.initializeAudioContext();
        }
    }, { once: true });
    
    // Initialize audio context on first user interaction
    document.addEventListener('click', function() {
        if (audioManager && typeof audioManager.initializeAudioContext === 'function') {
            audioManager.initializeAudioContext();
        }
    }, { once: true });
    
    document.addEventListener('touchstart', function() {
        if (audioManager && typeof audioManager.initializeAudioContext === 'function') {
            audioManager.initializeAudioContext();
        }
    }, { once: true });
    
    // Also keep direct event listeners as backup
    const playButton = document.querySelector('.play-button');
    const continueButton = document.querySelector('.continue-button');
    const settingsButton = document.querySelector('.settings-btn');
    const profileButton = document.querySelector('.profile-btn');
    
    if (playButton) {
        playButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Play button clicked');
            showLevelSelection();
        });
    } else {
        console.error('Play button not found');
    }

    if (continueButton) {
        continueButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Continue button clicked');
            gameState.level = gameState.lastPlayedLevel;
            showGame();
        });
    } else {
        console.error('Continue button not found');
    }

    if (settingsButton) {
        settingsButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Settings button clicked');
            showSettings();
        });
    } else {
        console.error('Settings button not found');
    }

    if (profileButton) {
        profileButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Profile button clicked');
            showProfile();
        });
    } else {
        console.error('Profile button not found');
    }
    
    const instructionsButton = document.querySelector('.instructions-button');
    if (instructionsButton) {
        instructionsButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Instructions button clicked');
            showInstructions();
        });
    } else {
        console.error('Instructions button not found');
    }
}

// Show Settings Panel
function showSettings() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(5px);
    `;
    
    // Create settings panel
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.style.cssText = `
        background: linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%);
        border-radius: 16px;
        padding: 30px;
        width: 90%;
        max-width: 450px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        position: relative;
        border: 1px solid #c5d0e0;
        color: #2c3e50;
    `;
    
    // Create panel content
    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="
                margin: 0 0 5px 0; 
                color: #2c3e50; 
                font-size: 28px; 
                font-family: 'Poppins', sans-serif; 
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">
                Settings
            </h2>
            <p style="
                margin: 0; 
                color: #7f8c8d; 
                font-size: 14px; 
                font-family: 'Poppins', sans-serif;
            ">
                Customize your game experience
            </p>
        </div>
        
        <div class="setting-item" style="
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 15px 0; 
            border-bottom: 1px solid #e0e6ed; 
            margin-bottom: 10px;
        ">
            <div style="display: flex; align-items: center;">
                <i class="fas fa-volume-up" style="
                    color: #3498db; 
                    margin-right: 12px; 
                    font-size: 20px;
                "></i>
                <span style="
                    color: #2c3e50; 
                    font-size: 16px; 
                    font-weight: 500; 
                    font-family: 'Poppins', sans-serif;
                ">
                    Sound
                </span>
            </div>
            <label class="switch">
                <input type="checkbox" id="sound-toggle" \${gameState.settings?.sound ? 'checked' : ''}>
                <span class="slider"></span>
            </label>
        </div>
        
        <div class="setting-item" style="
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 15px 0; 
            border-bottom: 1px solid #e0e6ed; 
            margin-bottom: 25px;
        ">
            <div style="display: flex; align-items: center;">
                <i class="fas fa-lightbulb" style="
                    color: #f39c12; 
                    margin-right: 12px; 
                    font-size: 20px;
                "></i>
                <span style="
                    color: #2c3e50; 
                    font-size: 16px; 
                    font-weight: 500; 
                    font-family: 'Poppins', sans-serif;
                ">
                    Hints
                </span>
            </div>
            <label class="switch">
                <input type="checkbox" id="hints-toggle" \${gameState.hintsEnabled ?? true}>
                <span class="slider"></span>
            </label>
        </div>
        
        <button id="reset-game-btn" style="
            width: 100%;
            padding: 15px;
            margin-bottom: 12px;
            background: linear-gradient(to right, #e74c3c, #c0392b);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            font-family: 'Poppins', sans-serif;
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            transition: all 0.3s ease;
        ">
            <i class="fas fa-redo" style="margin-right: 8px;"></i>Reset Game
        </button>
        
        <button id="close-btn" style="
            width: 100%;
            padding: 15px;
            background: linear-gradient(to right, #3498db, #2980b9);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            font-family: 'Poppins', sans-serif;
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
            transition: all 0.3s ease;
        ">
            <i class="fas fa-times" style="margin-right: 8px;"></i>Close
        </button>
    `;
    
    // Add styles for toggle switches
    const style = document.createElement('style');
    style.textContent = `
        .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
        }
        
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #bdc3c7;
            transition: .4s;
            border-radius: 30px;
        }
        
        .slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background: linear-gradient(to right, #3498db, #2980b9);
        }
        
        input:checked + .slider:before {
            transform: translateX(30px);
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
        }
        
        button:active {
            transform: translateY(0);
        }
        
        /* Ensure text is visible */
        #settings-panel {
            color: #2c3e50;
        }
        
        #settings-panel span {
            color: #2c3e50 !important;
        }
        
        #settings-panel h2 {
            color: #2c3e50 !important;
        }
        
        #settings-panel p {
            color: #7f8c8d !important;
        }
    `;
    document.head.appendChild(style);
    
    // Add Font Awesome if not already present
    if (!document.querySelector('[href*="fontawesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
    
    // Add panel to overlay
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    
    // Wait for DOM to be updated, then get elements
    setTimeout(() => {
        // Get elements
        const soundToggle = document.getElementById('sound-toggle');
        const hintsToggle = document.getElementById('hints-toggle');
        const resetGameBtn = document.getElementById('reset-game-btn');
        const closeBtn = document.getElementById('close-btn');
        
        // Sound toggle
        if (soundToggle) {
            soundToggle.checked = gameState.settings?.sound ?? true;
            soundToggle.addEventListener('change', () => {
                if (!gameState.settings) gameState.settings = {};
                gameState.settings.sound = soundToggle.checked;
                saveGame();
                
                // Update sound if audio manager exists
                if (audioManager && audioManager.sounds) {
                    for (let sound in audioManager.sounds) {
                        audioManager.sounds[sound].volume = soundToggle.checked ? (gameState.settings.soundVolume || 50)/100 : 0;
                    }
                }
            });
        }
        

        
        // Hints toggle
        if (hintsToggle) {
            hintsToggle.checked = gameState.hintsEnabled ?? true;
            hintsToggle.addEventListener('change', () => {
                if (!gameState.hintsEnabled) gameState.hintsEnabled = true;
                gameState.hintsEnabled = hintsToggle.checked;
                saveGame();
            });
        }
        
        // Reset game button
        if (resetGameBtn) {
            resetGameBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset the entire game? This will clear all progress.')) {
                    // Reset game state to initial values
                    gameState = {
                        level: 1,
                        moves: 0,
                        selectedBottle: null,
                        bottles: [],
                        moveHistory: [],
                        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00'],
                        lastPlayedLevel: 1,
                        highScores: {},
                        profile: {
                            name: 'Player',
                            level: 1,
                            totalStars: 0,
                            gamesPlayed: 0
                        },
                        settings: {
                            sound: true,
                            vibration: true,
                            theme: 'default',
                            infinitySkips: false,
                            soundVolume: 50,
                            vibrationIntensity: 'medium',
                            autoSave: true,
                            difficulty: 'normal'
                        },
                        timer: {
                            seconds: 0,
                            minutes: 0,
                            isRunning: false,
                            interval: null
                        },
                        skipsAvailable: 3,
                        skipsUsed: 0,
                        hintsEnabled: true
                    };
                    
                    saveGame();
                    showHome();
                    
                    // Close settings panel
                    overlay.remove();
                }
            });
        }
        
        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.remove();
            });
        }
    }, 10); // Small delay to ensure DOM is updated
    
    // Close panel when clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Sound System for Water Sort Game

// Create the audio manager
const audioManager = {
    sounds: {},
    musicTrack: null,
    initialized: false,
    
    // Initialize sound system
    init: function() {
        if (this.initialized) return;
        
        // Define sound effects with high-quality sounds
        this.sounds = {
            // Premium water pouring sound (soft and satisfying)
            pour: new Audio('https://assets.mixkit.co/active_storage/sfx/2717/2717-preview.mp3'),
            
            // Success sound - pleasant chime
            success: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
            
            // Click sound - clean and modern UI click
            click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
            
            // Error sound - gentle notification
            error: new Audio('https://assets.mixkit.co/active_storage/sfx/950/950-preview.mp3'),
            
            // Level complete - celebratory fanfare
            levelComplete: new Audio('https://assets.mixkit.co/active_storage/sfx/1010/1010-preview.mp3'),
            
            // Additional sounds
            bottleSelect: new Audio('https://assets.mixkit.co/active_storage/sfx/1567/1567-preview.mp3'),
            undo: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
            reset: new Audio('https://assets.mixkit.co/active_storage/sfx/555/555-preview.mp3')
        };
        
        // Background music is completely removed
        this.musicTrack = null;
        
        // Preload all sounds with better error handling
        for (const sound in this.sounds) {
            try {
                // Set sound properties for better playback
                this.sounds[sound].preload = 'auto';
                this.sounds[sound].volume = 0.5; // Set default volume
                
                // For iOS and Chrome autoplay policies, we need to initialize audio context on user interaction
                document.addEventListener('click', () => {
                    this.sounds[sound].load();
                    // Initialize audio context on first user interaction
                    if (sound === 'click') {
                        const temp = this.sounds[sound].cloneNode();
                        temp.volume = 0;
                        temp.play().then(() => temp.pause()).catch(() => {});
                    }
                }, {once: true});
                
                document.addEventListener('touchstart', () => {
                    this.sounds[sound].load();
                    // Initialize audio context on first user interaction
                    if (sound === 'click') {
                        const temp = this.sounds[sound].cloneNode();
                        temp.volume = 0;
                        temp.play().then(() => temp.pause()).catch(() => {});
                    }
                }, {once: true});
                
            } catch (err) {
                console.warn(`Failed to preload sound: ${sound}`, err);
            }
        }
        
        this.initialized = true;
        console.log('Audio system initialized');
        
        // Background music is removed, so no music state to restore
    },
    

    
    // Enhanced vibration function
    vibrate: function(pattern) {
        if (!gameState.settings.vibration || !navigator.vibrate) return;
        
        const intensity = gameState.settings.vibrationIntensity || 'medium';
        let multiplier;
        
        switch (intensity) {
            case 'light':
                multiplier = 0.5;
                break;
            case 'strong':
                multiplier = 1.5;
                break;
            default: // medium
                multiplier = 1;
        }
        
        // If pattern is an array, multiply each duration
        if (Array.isArray(pattern)) {
            pattern = pattern.map(duration => Math.round(duration * multiplier));
        } else {
            pattern = Math.round(pattern * multiplier);
        }
        
        navigator.vibrate(pattern);
    },
    
    // Initialize audio context on first user interaction
    initializeAudioContext: function() {
        if (this.audioContextInitialized) return;
        
        // Create a silent buffer to initialize audio context on first user interaction
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            
            // Create a silent sound to unlock audio on iOS/Safari
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
            }, 100);
            
            this.audioContextInitialized = true;
            console.log('Audio context initialized');
        } catch (err) {
            console.warn('Could not initialize audio context:', err);
        }
    },
    
    // Play a sound effect with enhanced audio control
    playSound: function(soundName) {
        if (!gameState.settings.sound || !this.sounds[soundName]) return;
        
        try {
            // Create a new audio object by cloning for overlapping sounds
            const soundClone = this.sounds[soundName].cloneNode();
            
            // Customize volume based on sound type for better audio balance
            switch(soundName) {
                case 'pour':
                    soundClone.volume = 0.5;
                    break;
                case 'click':
                case 'bottleSelect':
                    soundClone.volume = 0.4;
                    break;
                case 'error':
                    soundClone.volume = 0.5;
                    break;
                case 'success':
                    soundClone.volume = 0.6;
                    break;
                case 'levelComplete':
                    soundClone.volume = 0.7;
                    break;
                case 'reset':
                case 'undo':
                    soundClone.volume = 0.55;
                    break;
                default:
                    soundClone.volume = 0.5;
            }
            
            // Play the sound with proper error handling
            soundClone.play().catch(err => {
                // Try to initialize audio context on user interaction if needed
                console.warn('Audio play failed:', err);
                // Retry after a small delay to allow audio context to be established
                setTimeout(() => {
                    try {
                        soundClone.play().catch(retryErr => console.warn('Retry audio play failed:', retryErr));
                    } catch (retryErr) {
                        console.error('Retry error:', retryErr);
                    }
                }, 100);
            });
            
            // Enhanced vibration feedback
            this.vibrate(soundName === 'pour' ? 40 : soundName === 'success' ? [45, 20, 45] : soundName === 'levelComplete' ? [70, 40, 70, 40, 70] : soundName === 'error' ? 120 : soundName === 'bottleSelect' ? 25 : soundName === 'reset' ? [20, 10, 20, 10, 20] : soundName === 'undo' ? 35 : 20);
        } catch (err) {
            console.error('Error playing sound:', err);
        }
    },
    
    
};

// Modify initGame to handle audio
const originalInitGame = initGame;
initGame = function() {
    // Initialize audio system if not already
    if (!audioManager.initialized) {
        audioManager.init();
    }
    
    // Background music is removed
    
    // Call the original function
    const result = originalInitGame.apply(this, arguments);
    return result;
};

// Modify pour function to play sound
const originalPour = pour;
pour = function(from, to) {
    // Call the original function
    originalPour(from, to);
    
    // Play pouring sound
    audioManager.playSound('pour');
};

// Modify selectBottle to play enhanced bottle selection sounds
const originalSelectBottle = selectBottle;
selectBottle = function(index) {
    const prevSelected = gameState.selectedBottle;
    
    // Call the original function
    originalSelectBottle(index);
    
    // Play appropriate sounds with better user feedback
    if (prevSelected === null && gameState.selectedBottle !== null) {
        // First bottle selection - distinctive sound
        audioManager.playSound('bottleSelect');
    } else if (prevSelected !== null) {
        // Second bottle selection
        if (prevSelected !== index) {
            if (canPour(prevSelected, index)) {
                // Valid pour selection - no sound here as pour sound will play
            } else {
                // Invalid pour selection - clear error sound
                audioManager.playSound('error');
            }
        } else {
            // Clicked same bottle twice - deselection sound
            audioManager.playSound('click');
        }
    }
};

// Modify checkWin to play success sound and show completion screen
const originalCheckWin = checkWin;
checkWin = function() {
    console.log('Redefined checkWin called');
    // Call the original checkWin function to determine win status
    const result = originalCheckWin.apply(this, arguments);
    
    console.log('Original checkWin returned:', result);
    
    // Only handle completion if win condition was met
    if (result) {
        console.log('Level completed - showing completion screen');
        // The original function already handles showing the completion screen
        // and playing the sound, so we don't need to duplicate that
    }
    
    return result;
};

// Modify undoMove to play distinctive undo sound
const originalUndoMove = undoMove;
undoMove = function() {
    if (gameState.moveHistory.length > 0) {
        originalUndoMove();
        audioManager.playSound('undo');
    }
};

// Modify resetLevel to play distinct reset sound
const originalResetLevel = resetLevel;
resetLevel = function() {
    originalResetLevel();
    audioManager.playSound('reset');
}

// Modify skipLevel to NOT play sound
const originalSkipLevel = skipLevel;
skipLevel = function() {
    // Call original function without playing any sound
    originalSkipLevel();
    
    // No sound played for skip level
};



// Enhanced history navigation handling
window.addEventListener('popstate', function() {
    console.log('Browser back/forward navigation detected');
    
    // Let the audio manager handle music restoration on navigation
    if (audioManager.initialized) {
        audioManager.handleNavigation();
    } else {
        // Initialize if needed
        audioManager.init();
        setTimeout(() => audioManager.handleNavigation(), 300);
    }
});



// Add click sound to navigation buttons
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the audio manager
    audioManager.init();
    
    // Add sound to all buttons
    const addButtonHandlers = () => {
        const buttons = document.querySelectorAll('button, .play-button, .continue-button, .profile-btn, .back-btn, .close-btn, .level-box:not(.locked)');
        
        buttons.forEach(button => {
            // Avoid adding multiple listeners
            if (!button.dataset.soundAdded) {
                button.dataset.soundAdded = true;
                button.addEventListener('click', () => {
                    audioManager.playSound('click');
                });
            }
        });
    };
    
    // Initial call
    addButtonHandlers();
    
    // Set up a mutation observer to watch for new buttons
    const observer = new MutationObserver(() => {
        addButtonHandlers();
    });
    
    // Start observing
    observer.observe(document.body, { 
        childList: true,
        subtree: true
    });
});











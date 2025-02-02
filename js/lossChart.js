document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    const PADDING = 1;  // Padding from canvas edges

    // Configuration for the loss curve and its animation
    const config = {
        duration: 1500,       // Animation duration in milliseconds
        decayRate: 5,         // Controls steepness of decay
        steps: 100,           // Number of points making up the curve
        noiseAmplitude: 75,  // Maximum noise added (fading out as u → 1)
        noiseDecay: 3         // Controls the rate at which noise decays
    };
    
    // Calculate available drawing area considering padding
    const xAxisRight = canvas.width - 2 * PADDING;
    const yAxisTop = canvas.height - 2 * PADDING;
    
    // Precompute a noise array for consistency across frames
    const noiseArray = Array.from({ length: config.steps + 1 }, () => Math.random() - 0.5);
    
    // Base loss function: a gradient descent curve with exponential decay
    const baseLoss = u =>
        yAxisTop * (1 - (1 - Math.exp(-config.decayRate * u)) / (1 - Math.exp(-config.decayRate)));
    
    // Combined loss function adds decaying noise to the base loss
    const loss = (u, i) =>
        baseLoss(u) + Math.pow(1 - u, config.noiseDecay) * config.noiseAmplitude * noiseArray[i];
    
    // Animation variable
    let startTime = null;

    // Animate the loss curve drawing over time.
    // On each frame, we re-read the CSS variables so that any theme change is picked up.
    function animateLine(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / config.duration, 1);
        
        // Retrieve CSS colors from the <body> to pick up theme changes.
        const styles = getComputedStyle(document.body);
        const offWhite = styles.getPropertyValue('--color-off-white').trim();
        const accent2 = styles.getPropertyValue('--color-accent-1').trim();
        // Retrieve computed style from an element that uses the desired font, e.g., .info
        const infoFont = getComputedStyle(document.querySelector('.info')).font;

        // Clear the canvas for redrawing.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up a transformed coordinate system:
        // Translate to bottom-left corner and flip the y-axis upward.
        ctx.save();
        ctx.translate(PADDING, canvas.height - PADDING);
        ctx.scale(1, -1);
        
        // Draw static axes (x-axis and y-axis).
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(xAxisRight, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, yAxisTop);
        ctx.strokeStyle = offWhite;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw the animated loss curve with noise.
        const currentSteps = Math.floor(config.steps * progress);
        ctx.beginPath();
        for (let i = 0; i <= currentSteps; i++) {
            const u = i / config.steps;
            const x = xAxisRight * u;
            const y = loss(u, i);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = accent2;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
        
        ctx.fillStyle = offWhite;
        ctx.font = infoFont;
        ctx.fillText('Entropy', 15, 15);
        ctx.fillText('Life', canvas.width - 45, canvas.height - 15);
        
        if (progress < 1) {
            requestAnimationFrame(animateLine);
        }
    }
    
    // Expose a function so that the loss chart can be redrawn (replaying the animation)
    // when the theme is changed.
    window.redrawLossChart = function() {
        startTime = null;
        requestAnimationFrame(animateLine);
    };

    // Start the animation initially.
    requestAnimationFrame(animateLine);
});

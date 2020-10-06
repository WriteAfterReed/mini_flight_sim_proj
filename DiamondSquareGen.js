/**
* @fileoverview - Class for generating a height matrix using diamond sqaured.
* @author - Reedo
*
*/
class DiamondSquare{
/**
 * @param {number} depth is the number of triangles to max on axis, same as div
 * @param {number} tLC is the initial top left corner value
 * @param {number} tRc is the initial top right corner value
 * @param {number} blc is the intiial bottom left corner value
 * @param {number} bRc is the initial bottom right corner value
 * @param {number} randMin is the lower bound for our random range
 * @param {number} randMax is the upper bound for our random range
 */
    constructor(depth, tLC, tRC, bLC, bRC, randMin, randMax){
        this.depth = depth;     
        this.size = this.depth + 1; // This will work if depth is a power of 2. 2^k + 1
        var grid = [];              // This array will store our map of heights

        // Generate empty matrix
        for (var y = 0; y < this.size; y++){
            var row = [];
            for (var x = 0; x < this.size; x++) 
            {
            row.push(0);
            }
            grid.push(row);
        }

        this.grid = grid;

        // Set the four corners
        this.grid[0][0] = tLC;
        this.grid[0][this.depth] = tRC;
        this.grid[this.depth][0] = bLC;
        this.grid[this.depth][this.depth] = bRC;
        this.randMin = randMin;
        this.randMax = randMax;

        // Call function to actually generate the height map
        this.genGrid();
    }

    /**
     * Generates the diamond sqaure grid
     */
    genGrid(){
        var step = this.depth;
        var max = this.randMax;
        var min = this.randMin;
        var halfStep = step/2;
        var count = 0;
        while(halfStep > 1){ 

            // In hindsight I could have used a do while or for loop to make halfstep works as my break case...
            // But this works so whatev
            if(count > 0){
                halfStep = step/2;
            }

            // This is the diamond loop
            for (var y = halfStep; y < this.depth; y += step){
                for (var x = halfStep; x < this.depth; x += step) {
                    var value = this.diamondStep(x, y, halfStep); // call function that does the average for the diamond step
                    var noise = this.getNoise(max, min);
                    this.grid[x][y] = value + noise;  // set value for coordinate in height map
                }
            }

            //This is the square loop
            for (var y = 0; y <= this.depth; y += halfStep){
                for (var x = (y + halfStep) % step; x <= this.depth; x += step) {
                    var value = this.squareStep(x, y, halfStep); // call the function that does the average for the square step
                    var noise = this.getNoise(max, min);
                    this.grid[x][y] = value + noise; // set value for coordinate in height map
                }
            }
            
            count++;
            // decrease our noise... I made it .55 since I felt halving it was too low, and 3/4 was too high
            max = max * .55;
            min = min * .55;
            step = Math.ceil(step/2);
        }


    }

    /** Does the math for our diamond step
     * @param {number} x for the x coordinate we working from
     * @param {number} y for the y coordinate we working from
     * @param {number} radius which is the step size of our operation
     */ 
    diamondStep(x, y, radius){
        var top = this.grid[x + radius][y + radius];         // top
        var bot = this.grid[x - radius][y - radius];         // bottom
        var left = this.grid[x + radius][y - radius];        // left
        var right = this.grid[x - radius][y + radius];       // right
        var average = (top + bot + left + right)/4;
        return average;

    }

    /** Does the math for our square step
     * @param {number} x for the x coordinate we working from
     * @param {number} y for the y coordinate we working from
     * @param {number} radius which is the step size of our operation
     */
    squareStep(x, y, radius){  
        var point = 4;
        var topLeft = 0;
        var topRight = 0;
        var bottomLeft = 0;
        var bottomRight = 0;

        // Error checking that doesn't work for topLeft and topRight because JS is weird... hence the redundant if statements
        try{topLeft = this.grid[x][y - radius];}
        catch(e){}
        try{topRight = this.grid[x][y + radius];}
        catch(e){}
        try{bottomRight = this.grid[x + radius][y];}
        catch(e){}
        try{bottomLeft = this.grid[x - radius][y];}
        catch(e){}

        // Makes sure nobody is NaN
        if(isNaN(topLeft)){
            topLeft = 0;
            point = 3;
        }
        if(isNaN(topRight)){
            topRight = 0;
            point = 3;
        }
        if(isNaN(bottomRight)){
            bottomRight = 0;
            point = 3;
        }
        if(isNaN(bottomLeft)){
            bottomLeft = 0;
            point = 3;
        }

        var average = (topLeft + topRight + bottomLeft + bottomRight)/point; // ca
        return average;

    }

    /**
    * Generates the noise based off the current min and max
    * @param {number} max the max value for rand range
    * @param {number} min the min value for rand range
    */
    getNoise(max, min){
        var noise = Math.random() * (max - min) + min;
        return noise;
    }

    // Returns the current values of the heightMap
    getGrid(){
        return this.grid;
    }
}

// Below was used for testing... just ran using node
// var temp = new DiamondSquare(4, .5, .5, .5, .5, .1, -.1);
// console.log("FIN");
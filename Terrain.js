/** Class implementing 3D terrain. */
class Terrain{
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 * @param {number} minZ Min Z coordinate values
 * @param {number} maxZ Max Z coordinate values
 */
// We have just extended the constructor to have Z components. Now we need to edit the rest of the project.
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;

        // Generate values for the four corners
        var r1 = Math.random() * (.3 - .1) + .1;
        var r2 = .25;
        var r3 = Math.random() * (.3 - .1) + .1;
        var r4 = .25;

        // Get the heightMap
        this.heightMap = new DiamondSquare(div, r1, r2, r3, r4, -0.15, 0.15);
        this.zValues = this.heightMap.getGrid();
        console.log("zValues is generated!");
        console.log(this.zValues);

        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");

        this.generateTriangles();
        console.log("Terrain: Generated triangles");

        this.generateLines();
        console.log("Terrain: Generated lines");

        this.generateNormals();
        console.log("Terrain: Generated Normals");

        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }

    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        var vid = 3 * (i * (this.div + 1) + j);
        this.vBuffer[vid] = v[0];
        this.vBuffer[vid + 1] = v[1];
        this.vBuffer[vid + 2] = v[2];
    }

    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        var vid = 3 * (i * (this.div + 1) + j);
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid + 1];
        v[2] = this.vBuffer[vid + 2];
    }

    /**
     * Set the values for a normal vector
     * @param {object} v a array of coords to show a vertex
     * @param {number} i the ith row of vertices
     * @param {number} j the jth column of vertices
     */
    setNormal(v,i,j)
    {
        var vid = 3 * (i * (this.div + 1) + j);
        this.nBuffer[vid] = v[0];
        this.nBuffer[vid + 1] = v[1];
        this.nBuffer[vid + 2] = v[2];
    }

    /**
     * Function to help get average of multiple vectors stored in a 2d array
     * @param {array} grid helper function to calculate the averages of arrays for the normals
     */
    getVectorAverage(grid)
    {
        var sum = [0,0,0];
        var average = [0,0,0];
        var points = grid.length;
        if(points != 0){
            for(var i = 0; i < points; i++)
            {
                for(var j = 0; j < 3; j++){
                    sum[j] += grid[i][j];
                }
            }
            for(var i = 0; i < 3; i++)
            {
                average[i] = sum[i]/points;
            }
        }
        return average;
    }

   /**
    * A helper function for calculating normals
    * @param {number} x coordinate for the vertex we want
    * @param {number} y coordinate for the vertex we want
    * @param {number} x1 for second point we want
    * @param {number} y1 for second point we want
    * @param {number} x2 for third point we want
    * @param {number} y2 for third point we want
    */
    getNormal(x, y, x1, y1, x2, y2)
    {
        var vect1 = [0,0,0];
        var vect2 = [0,0,0];
        var vect3 = [0,0,0];
        this.getVertex(vect1, x, y);
        this.getVertex(vect2, x1, y1);
        this.getVertex(vect3, x2, y2);
        // vect2 = vect2 - vect1;
        // vect3 = vect3 - vect1;
        vec3.subtract(vect2, vect2, vect1);
        vec3.subtract(vect3, vect3, vect1);

        vec3.cross(vect1, vect2, vect3);
        vec3.normalize(vect1, vect1);

        return vect1;
    }

    /**
    * Send the buffer objects to WebGL for rendering
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");

        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");

        // Specify faces of the terrain
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");

        //Setup Edges
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;

        console.log("triangulatedPlane: loadBuffers");
        //this.printBuffers();
    }

    /**
    * Render the triangles
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);

        //Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }

    /**
    * Render the triangle edges wireframe style
    */
    drawEdges(){

        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize,
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute,
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);

        //Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);
    }

    /**
     * Fill the vertex and buffer arrays
     */
    generateTriangles()
    {
        //Your code here
        var deltaX = (this.maxX - this.minX) / this.div;
        var deltaY = (this.maxY - this.minY) / this.div;
        for (var i = 0; i <= this.div; i++){
            for(var j = 0; j <= this.div; j++)
            {
                //console.log("col = " + j)
                this.vBuffer.push(this.minX + deltaX * j); // X
                this.vBuffer.push(this.minY + deltaY * i); // Y
                // Set z values from the height map...
                // I should have used the set and get operations probably but I made a matrix so it was easier to test like a total idiot
                // Debugging that AND bling phong is why this is late...
                // Sorry, I am a bit slow... However, nobody is reading
                // and I already accepted the grade plently to that's on me.
                this.vBuffer.push(this.zValues[j][i]);     // Set z values from the height map...

                //Editing these values causes lightness and darkness to change
                this.nBuffer.push(0);
                this.nBuffer.push(0);
                this.nBuffer.push(1);

            }
        }

        for (var i = 0; i < this.div; i++){
            for(var j = 0; j < this.div; j++)
            {

                var vid = i * (this.div + 1) + j;
                this.fBuffer.push(vid);
                this.fBuffer.push(vid + 1);
                this.fBuffer.push(vid + this.div + 1);

                this.fBuffer.push(vid + 1);
                this.fBuffer.push(vid + 1 + this.div + 1);
                this.fBuffer.push(vid + this.div + 1);

            }
        }

        //
        this.numVertices = this.vBuffer.length/3;
        this.numFaces = this.fBuffer.length/3;
    }
    /**
     * Function which calculates the normal vectors for our shaders
     * I was going to use a array of tuples to handle these coordinates but I changed it to two arrays for speed based off JS lack of tuples
     *
    */
    generateNormals(){
        for(var i = 0; i < this.div - 1; i++)
        {
            for(var j = 0; j < this.div - 1; j++)
            {
                var neighbors = [];
                // I used these coordinates
                /*
                *      5---4
                *      | \ | \
                *      1---c---2
                *        \ | \ |
                *          3---6
                */
                var xValues = [i - 1, //1
                               i - 1, //5
                                   i, //4
                               i + 1, //2
                               i + 1, //6
                                   i, //3
                                   i]; //1

                var yValues = [    j, //1
                               j + 1, //5
                               j + 1, //4
                                   j, //2
                               j - 1, //6
                               j - 1, //3
                                   j]; //1

                for(var k = 0; k < xValues.length - 1; k++)
                {
                    if(!(isNaN(xValues[k]) || isNaN(xValues[k + 1]) || xValues[k] == 0 || xValues[k + 1] == 0))
                    {
                        neighbors.push(this.getNormal(i,j,xValues[k],yValues[k],xValues[k+1],yValues[k+1])); // Calls helper function which calculates normal from three vectors
                    }
                }
                var average = this.getVectorAverage(neighbors); // Calls function which averages the vector values
                this.setNormal(average, i, j);
            }
        }
    }

    /**
     * Print vertices and triangles to console for debugging
     */
    printBuffers(){
        for(var i=0;i<this.numVertices;i++){
            console.log("v ", this.vBuffer[i*3], " ",
                            this.vBuffer[i*3 + 1], " ",
                            this.vBuffer[i*3 + 2], " ");

        }

        for(var i=0;i<this.numFaces;i++){
            console.log("f ", this.fBuffer[i*3], " ",
                            this.fBuffer[i*3 + 1], " ",
                            this.fBuffer[i*3 + 2], " ");

        }

    }

    /**
     * Generates line values from faces in faceArray
     * to enable wireframe rendering
     */
    generateLines(){
        var numTris=this.fBuffer.length/3;
        for(var f=0;f < numTris;f++){
            var fid=f*3;
            this.eBuffer.push(this.fBuffer[fid]);
            this.eBuffer.push(this.fBuffer[fid+1]);

            this.eBuffer.push(this.fBuffer[fid+1]);
            this.eBuffer.push(this.fBuffer[fid+2]);

            this.eBuffer.push(this.fBuffer[fid+2]);
            this.eBuffer.push(this.fBuffer[fid]);
        }

    }

}

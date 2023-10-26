const canvas = document.getElementById('canvas');
canvas.width = 400;
canvas.height = 400;
const context = canvas.getContext('2d');
const buffer = context.getImageData(0, 0, canvas.width, canvas.height);
const step = buffer.width * 4;
const epsilon = 0.000001;
const DPI = 150/30;
var bindings = [];
var anchors = [];

/**
 * Inserts a pixel of the desired color at the x, y coordinates.
 * 
 * O(1)
 * @param {Number} x - coordinates of the x
 * @param {Number} y - coordinates of the y
 * @param {Number[]} color - color in format [R,G,B,A]
 * @returns 
 */
function put_pixel(x, y, color) {
    var xr = Math.floor(canvas.width / 2 + x);
    var yr = Math.floor(canvas.height / 2 - y - 1);
    var offset = 4 * xr + step * yr;

    if (xr < 0 ||  yr < 0 || xr >= canvas.width || yr >= canvas.height) {
        return;
    }

    buffer.data[offset++] = color[0];
    buffer.data[offset++] = color[1];
    buffer.data[offset++] = color[2];
    buffer.data[offset++] = color[3] || 255;
}

/**
 * Refreshes the canvas buffer
 * 
 * O(1)
 */
function update_canvas() {
    context.putImageData(buffer, 0, 0);
}

/**
 * Creates n bindings around the perimeter of a circle.
 * 
 * O(n)
 * @param {Number[]} center - coordinates of the circle center
 * @param {Number} radius - radius of the circle
 * @param {Number} n - number of bindings
 */
function create_bindings(center, radius, n) {
    var x0 = center[0];
    var y0 = center[1];
    var offset = 360 / n;
    
    for (let i = 0; i < 360; i += offset) {
        var x = x0 + radius * Math.cos((i) * Math.PI / 180);
        var y = y0 + radius * Math.sin((i) * Math.PI / 180);
        bindings.push([Math.floor(x*DPI), Math.floor(y*DPI)]);
    }
}

/**
 * Rasterizes a line by coordinates of its start and end points.
 * 
 * O(1)
 * @param {Number[]} point_0 - coordinates of point 0 [x0, y0]
 * @param {Number[]} point_1 - coordinates of point 1 [x1, y1]
 * @param {Number[]} color - color in format [R,G,B,A]
 */
function bresenhams_line(point_0, point_1, color) {
    var x0 = point_0[0];
    var y0 = point_0[1];
    var x1 = point_1[0];
    var y1 = point_1[1];
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1;
    var sy = y0 < y1 ? 1 : -1;
    var error = dx - dy;
    put_pixel(x1, y1, color);
    while (x0 != x1 && y0 != y1) {
        put_pixel(x0, y0, color);
        var error_accumulator = error*2;
        if (error_accumulator > -dy) {
            error -= dy;
            x0 += sx;
        }
        if (error_accumulator < dx) {
            error += dx;
            y0 += sy;
        }
    }
}

/**
 * Rasterizes a circle by the values of its center coordinates, diameter, and color value in RGBA format.
 * 
 * O(1)
 * @param {Number[]} center - coordinates of the circle center
 * @param {Number} radius - radius of the circle
 * @param {Number[]} color - color of the circle in RGBA format 
 */
function bresenhams_circle(center, radius, color) {
    var x0 = center[0];
    var y0 = center[1];
    var x = 0;
    var y = radius;
    var delta = 2 - 2 * radius;
    var error = 0;
    while (y >= 0) {
        put_pixel(x0 + x, y0 - y, color);
        put_pixel(x0 + y, y0 - x, color);
        put_pixel(x0 + y, y0 + x, color);
        put_pixel(x0 + x, y0 + y, color);
        put_pixel(x0 - x, y0 + y, color);
        put_pixel(x0 - y, y0 + x, color);
        put_pixel(x0 - y, y0 - x, color);
        put_pixel(x0 - x, y0 - y, color);
        error = 2*(delta + y) - 1;
        if (delta < 0 && error <= 0) {
            ++x;
            delta += 2*x + 1;
            continue;  
        }
        else if (delta > 0 && error > 0) {
            --y;
            delta -= 2*y + 1;
            continue;
        }
        x++;
        y--;
        delta += 2*(x - y);
    }
}

/**
 * Draws a line by coordinates of its start and end points.
 * 
 * O(1)
 * @param {Number[]} point_0 - current point [x0, y0]
 * @param {Number[]} point_1 - current point [x1, y1]
 * @param {Number[]} color - color of the circle in RGBA format 
 * @param {Number} line_width - width of the line in pixels 
 */
function line(point_0, point_1, color = [0,0,0,255], line_width = 1) {
    context.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] ? color[3]/255 : 1})`;
    context.lineWidth = line_width;
    context.beginPath();
    context.moveTo(canvas.width/2 + point_0[0], canvas.height/2 - point_0[1]);
    context.lineTo(canvas.width/2 + point_1[0], canvas.height/2 - point_1[1]);
    context.stroke();
    context.closePath();
}

/**
 * Draws a circle by the values of its center coordinates, diameter, and color value in RGBA format.
 * 
 * O(1)
 * @param {Number[]} center - coordinates of the circle center 
 * @param {Number} radius - radius of the circle
 * @param {Number[]} color - color of the circle in RGBA format 
 * @param {Number} line_width - width of the line in pixels  
 */
function circle(center, radius, color = [0,0,0,255], line_width = 2) {
    context.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] ? color[3]/255 : 1})`;
    context.lineWidth = line_width;
    context.beginPath();
    context.arc(canvas.width/2 + center[0], canvas.height/2 - center[1], radius, 0, 2*Math.PI);
    context.stroke();
    context.closePath();
}

/**
 * Draw points of the bindings.
 * 
 * O(n)
 * @param {Number[]} coordinates - coordinates of bindings [[x0,y0],[x1,y1], ...]
 * @param {Number[]} color - color of the circle in RGBA format
 */
function draw_bindings(coordinates, color = [0,0,0,255]) {
    for (var i = 0; i <= coordinates.length - 1; i++) {
        circle([coordinates[i][0], coordinates[i][1]], 5, color, 1);
    }
}

/**
 * Depicts a grid of cells on a background for easy perception.
 * 
 * O(n)
 * @param {Number} size_mm - size of the real scale in mm
 * @param {Number} line_width - width of the line in pixels
 * @param {Number[]} color - color of the circle in RGBA format
 */
function grid(size_mm, line_width = 1, color = [0,0,0,255]) {
    const size_px = (2 * size_mm * 18.897637795275593) / (DPI * 1.5);

    for (var i = 0; i <= canvas.width; i+= size_px) {
        var point_0 = [i, -canvas.height];
        var point_1 = [i, canvas.height];
        line(point_0, point_1, color, line_width)
        var point_0 = [-(i+size_px), -canvas.height];
        var point_1 = [-(i+size_px), canvas.height];
        line(point_0, point_1, color, line_width)
    }

    for (var i = 0; i <= canvas.height; i+= size_px) {
        var point_0 = [-canvas.width, i];
        var point_1 = [canvas.width, i];
        line(point_0, point_1, color, line_width)
        var point_0 = [-canvas.width, -(i+size_px)];
        var point_1 = [canvas.width, -(i+size_px)];
        line(point_0, point_1, color, line_width)
    }
}

/**
 * Draw the intersections across current point to the arc circle.
 * 
 * O(1)
 * @param {Number[]} point_0 - current point [x0, y0]
 * @param {Number[]} point_1 - current point [x1, y1]
 * @param {Number} radius - radius of the circle
 */
function line_circle_intersection(point_0, point_1, radius) {
    var x0 = point_0[0] == 0 ? x0 = epsilon: x0 = point_0[0];
    var y0 = point_0[1] == 0 ? y0 = epsilon: y0 = point_0[1];
    var x1 = point_1[0] == 0 ? x1 = epsilon: x1 = point_1[0];
    var y1 = point_1[1] == 0 ? y1 = epsilon: y1 = point_1[1];
    var k0 = (y1 - y0)/(x1 - x0);
    var b0 = -k0*x0 + y0;

    var A = k0*x0;
    var B = -A / k0;
    var C = -B * b0;
    var X0 = - A*C / (A*A + B*B);
    var Y0 = - B*C / (A*A + B*B);
    var d0 = Math.abs(C) / Math.sqrt(A*A + B*B);
    var d = radius*radius - C*C / (A*A + B*B);
    var m = Math.sqrt(d / (A*A + B*B));
    var ax = X0 + B * m;
    var ay = Y0 - A * m;
    var bx = X0 - B * m;
    var by = Y0 + A * m;

    line([ax*DPI,ay*DPI], [bx*DPI,by*DPI], [0,0,255,255]);
    circle([X0*DPI, Y0*DPI], 2, [255,128,128,255], 4)
    circle([ax*DPI,ay*DPI], 2, [255,128,128,255], 4);
    circle([bx*DPI,by*DPI], 2, [255,128,128,255], 4);
}

/**
 * Draws n symmetrical intersections of lines passing through point 1 with respect to the line formed between points 0 and 1.
 * 
 * O(n)
 * @param {Number[]} point_0 - current point [x0, y0]
 * @param {Number[]} point_1 - current point [x1, y1]
 * @param {Number} n - count of lines
 */
function point_intersection(point_0, point_1, n) {
    var x0 = point_0[0];
    var y0 = point_0[1];
    var x1 = point_1[0];
    var y1 = point_1[1];
    var k0 = (y1 - y0)/(x1 - x0);
    var b0 = -k0*x0 + y0;
    var angle = 360 / n;
    var angle_tangent = Math.tan(angle*(Math.PI/180));
    var unchanged_x = x1;
    var unchanged_y = y1;
    
    if (n % 2 == 0) { n = n / 2;}

    if (angle == 90) {
        var k1 = -1 / k0; 
    } else {
        var k1 = (angle_tangent + k0) / (1 - angle_tangent * k0);
    }

    for (var i = 0; i <= n-1; i++) {
        var new_x = x1 + 10;
        var new_y = k1* (new_x - x1) + b0;
        anchors.push([[unchanged_x, unchanged_y], [new_x, new_y]]);
        x1 = x1;
        y1 = new_y;
        k1 = (angle_tangent + k1) / (1 - angle_tangent * k1);
    }
}

grid(5, 1, [0,0,0,255*0.1]);
circle([0,0], 150, [0,0,0,255],2)
point_intersection([-10,0], [0, 15], 8);
create_bindings([0,0], 30, 16);
draw_bindings(bindings, [0,0,0,255]);

for (var i = 0; i <= anchors.length - 1; i++) {
    x0 = anchors[i][0][0];
    y0 = anchors[i][0][1];
    x1 = anchors[i][1][0];
    y1 = anchors[i][1][1];
    line_circle_intersection([x0,y0], [x1, y1], 30)
}
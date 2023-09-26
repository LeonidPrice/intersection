const canvas = document.getElementById('canvas');
canvas.width = 400;
canvas.height = 400;
const context = canvas.getContext('2d');
const buffer = context.getImageData(0, 0, canvas.width, canvas.height);
const step = buffer.width * 4;

var bindings = [];

/**
 * Inserts a pixel of the desired color at the x, y coordinates.
 * 
 * O(1)
 * @param {Number} x coordinates of the x
 * @param {Number} y coordinates of the y
 * @param {Number[]} color color in format [R,G,B,A]
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
 * @param {Number[]} center coordinates of the circle center
 * @param {Number} radius radius of the circle
 * @param {Number} n number of bindings
 */
function binding(center, radius, n) {
    var x0 = center[0];
    var y0 = center[1];
    var offset = 360 / n;
    
    for (let i = 0; i < 360; i += offset) {
        var x = x0 + radius * Math.cos((i) * Math.PI / 180);
        var y = y0 + radius * Math.sin((i) * Math.PI / 180);
        bindings.push([Math.floor(x), Math.floor(y)]);
    }
}

/**
 * Rasterizes a line by coordinates of its start and end points.
 * 
 * O(1)
 * @param {Number[]} point_0 coordinates of point 0 [x0, y0]
 * @param {Number[]} point_1 coordinates of point 1 [x1, y1]
 * @param {Number[]} color color in format [R,G,B,A]
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
        var error_2 = error * 2;
        if (error_2 > -dy) {
            error -= dy;
            x0 += sx;
        }
        if (error_2 < dx) {
            error += dx;
            y0 += sy;
        }
    }
}
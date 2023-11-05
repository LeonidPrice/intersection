const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 400;
var buffer = context.getImageData(0, 0, canvas.width, canvas.height);
const step = buffer.width * 4;
const epsilon = 10e-10;
const DPI = 150/30;
// window.innerWidth > window.innerHeight ? canvas.width = window.innerHeight : canvas.width = window.innerWidth;
// window.innerWidth > window.innerHeight ? canvas.height = window.innerHeight : canvas.height = window.innerWidth;
// window.innerWidth > window.innerHeight ? DPI = window.innerHeight/30 : DPI = window.innerWidth/30;

var bindings = [];
var anchors = [];

// window.addEventListener('resize', function() {
//     location.reload();
// });

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
 * Returns the color value at the point with x, y coordinates in RGBA format.
 * 
 * O(1)
 * @param {Number} x - coordinates of the x
 * @param {Number} y - coordinates of the y
 * @returns {Array} color in format [RGBA]
 */
function get_pixel_color(x, y) {
    var xr = Math.floor(canvas.width / 2 + x);
    var yr = Math.floor(canvas.height / 2 - y - 1);
    var offset = 4 * xr + step * yr;
    var original_data = buffer.data.slice(offset, offset + 4).map(value => Math.round(value));
    
    return [
        original_data[0],
        original_data[1],
        original_data[2],
        original_data[3]
    ];
}

/**
 * Returns a saturation value in the range 0-1.
 * 
 * O(1)
 * @param {Number} x - coordinates of the x
 * @param {Number} y - coordinates of the y
 * @returns {Number} saturation value
 */
function get_saturation(x, y) {
    var xr = Math.floor(canvas.width / 2 + x);
    var yr = Math.floor(canvas.height / 2 - y - 1);
    var offset = 4 * xr + step * yr;
    var original_data = buffer.data.slice(offset, offset + 4).map(value => Math.round(value));
    var r = original_data[0];
    var g = original_data[1];
    var b = original_data[2];
    return Number(((r+g+b)/765).toFixed(2));
}

/**
 * O(n^2)
 * @param {Number[]} array - input array
 * @returns {Number[]} output array
 */
function selection_sort(array) {
    var sorted_array = [];
    while (array.length > 0) {
        var smallest = array[0];
        var smallest_index = 0;
        for (var i = 1; i < array.length; i++) {
            if (array[i] < smallest) {
                smallest = array[i];
                smallest_index = i;
            }
        }
        sorted_array.push(array.splice(smallest_index, 1)[0])
    }
    return sorted_array;
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
        bindings.push([Math.floor(x), Math.floor(y)]);
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
 * @param {!Number[]} point_0 - current point [x0, y0]
 * @param {!Number[]} point_1 - current point [x1, y1]
 * @param {Number} radius - radius of the circle
 */
function line_circle_intersection(point_0, point_1, radius) {
    var x0 = point_0[0] == 0 ? epsilon : point_0[0];
    var y0 = point_0[1] == 0 ? epsilon : point_0[1];
    var x1 = point_1[0] == 0 ? epsilon : point_1[0];
    var y1 = point_1[1] == 0 ? epsilon : point_1[1];
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
    anchors.push([ax,ay], [bx,by]);
    line([ax,ay], [bx,by], [255,0,0,255]);
    circle([ax,ay], 2, [255,128,128,255], 4);
    circle([bx,by], 2, [255,128,128,255], 4);
    
}

/**
 * Draws n symmetrical intersections of lines passing through point 1 with respect to the line formed between points 0 and 1.
 * 
 * O(n)
 * @param {Number[]} point_0 - current point [x0, y0]
 * @param {Number[]} point_1 - current point [x1, y1]
 * @param {Number} radius - radius of the circle
 * @param {Number} n - count of lines
 */
function point_intersection(point_0, point_1, radius, n) {
    var x0 = point_0[0] == 0 ? epsilon : point_0[0];
    var y0 = point_0[1] == 0 ? epsilon : point_0[1];
    var x1 = point_1[0] == 0 ? epsilon : point_1[0];
    var y1 = point_1[1] == 0 ? epsilon : point_1[1];
    var k0 = (y1 - y0)/(x1 - x0);
    var b0 = -k0*x0 + y0;
    var angle = 360 / (2*n);
    var angle_tangent = Math.tan(angle*(Math.PI/180));
    var unchanged_x = x1;
    var unchanged_y = y1;
    var directions = [];

    if (angle == 90) {
        var k1 = -1 / k0; 
    } else {
        var k1 = (angle_tangent + k0) / (1 - angle_tangent * k0);
    }

    for (var i = 0; i <= n; i++) {
        var new_x = x1 + 10;
        var new_y = k1* (new_x - x1) + b0;
        directions.push([[unchanged_x, unchanged_y], [new_x, new_y]]);
        x1 = x1;
        y1 = new_y;
        k1 = (angle_tangent + k1) / (1 - angle_tangent * k1);
    }

    for (var i = 0; i <= directions.length - 1; i++) {
        x0 = directions[i][0][0];
        y0 = directions[i][0][1];
        x1 = directions[i][1][0];
        y1 = directions[i][1][1];
        line_circle_intersection([x0,y0], [x1, y1], radius)
    }
}

/**
 * Calculates the angle in degrees from the coordinates of point_0 with respect to the centre of the circle at point [0,0].
 * 
 * O(1)
 * @param {Number[]} point_0 - current point [x0, y0]
 * @returns {Number} value of the angle in degrees
 */
function get_angle(point_0) {
    var x0 = point_0[0] == 0 ? epsilon : point_0[0];
    var y0 = point_0[1] == 0 ? epsilon : point_0[1];

    if (x0 > 0 && y0 > 0) {
        return Math.atan(Math.abs(y0/x0))*180/Math.PI;
    }
    if (x0 < 0 && y0 > 0) {
        return 180 - Math.atan(Math.abs(y0/x0))*180/Math.PI;
    }
    if (x0 < 0 && y0 < 0) {
        return 180 + Math.atan(Math.abs(y0/x0))*180/Math.PI;
    }
    if (x0 > 0 && y0 < 0) {
        return 360 - Math.atan(Math.abs(y0/x0))*180/Math.PI;
    }

    // return (Math.atan2(y0, x0) * 180 / Math.PI + 360) % 360;
}

/**
 * Returns the coordinates of the point by its angle in degrees and radius.
 * 
 * O(1)
 * @param {Number} angle - angle in degrees.
 * @param {Number} radius - radius of the circle
 * @returns {Number[]} coordinates of the point [x,y]
 */
function get_point(angle, radius) {
    var x = radius * Math.cos((angle * Math.PI) / 180);
    var y = radius * Math.sin((angle * Math.PI) / 180);
    return [x,y];
}

/**
 * Compares the degree measures of the angles of two arrays and rebindings the theoretical points to the nearest actual points.
 * 
 * O(n²)
 * @param {Number[]} bindings_set - actual binding coordinates
 * @param {Number[]} anchors_set - theoretical reference coordinates
 * @param {Number} radius - radius of the circle
 * @param {Number} n - count of bindings
 * @returns {Number[]} array with coordinates of reassigned points
 */
function compare_bindings(bindings_set, anchors_set, radius) {
    var binding_angles = [];
    var anchor_angles = [];
    var rebindings = [];
    var coordinates = [];
    var angle_correction = 360 / (2*bindings_set.length);

    for (var i = 1; i < bindings_set.length; i++) {
        var x = bindings_set[i][0] == 0 ? epsilon : bindings_set[i][0];
        var y = bindings_set[i][1] == 0 ? epsilon : bindings_set[i][1];
        binding_angles.push(get_angle([x, y]));
    }

    binding_angles.push(360);
    anchors_set.splice(-2);

    for (var i = 0; i < anchors_set.length; i++) {
        var x = anchors_set[i][0] == 0 ? x = epsilon : x = anchors_set[i][0];
        var y = anchors_set[i][1] == 0 ? y = epsilon : y = anchors_set[i][1];
        anchor_angles.push(get_angle([x, y]));
    }
    
    anchor_angles = selection_sort(anchor_angles);

    for (var i = 0; i < anchor_angles.length; i++) {
        for (var j = 0; j < binding_angles.length; j++) {
            if (Math.abs(binding_angles[j] - anchor_angles[i]) < angle_correction) {
                if (anchor_angles[i] !== anchor_angles[i-1]) {
                    rebindings.push(binding_angles[j]);
                }   
            }
        }
    }

    for (var i = 0; i < rebindings.length; i++) {
        coordinates.push(get_point(rebindings[i], radius));
    }
    
    return coordinates;
}

function intersection(coordinates, n) {

    for (i = 0; i < coordinates.length; i++) {
        var x0 = coordinates[i][0];
        var y0 = coordinates[i][1];
        var index = (i + n) % coordinates.length;
        var x1 = coordinates[index][0];
        var y1 = coordinates[index][1];
        line([x0, y0], [x1, y1], [0,0,255,255])
    }
}

function load_image(src) {
    return new Promise((resolve, reject) => {
        var img = new Image();
        img.onload = function() {
            resolve(img);
        };
        img.onerror = function() {
            reject(new Error('Failed to load the image'));
        };
        img.src = src;
    });
}

function image_in_circle(context, image, x, y, radius) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI); 
    context.clip();
    context.drawImage(image, x - radius, y - radius, 2 * radius, 2 * radius);
}

load_image('./images/test_image_bw.png').then((img) => {
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    image_in_circle(context, img, canvas.width / 2, canvas.height / 2, 160);

    var N = 150;
    circle([0,0], 150, [0,0,0,255], 2);
    create_bindings([0,0], 150, N);
    draw_bindings(bindings, [0,255,0,255])
    point_intersection([-10*DPI,0*DPI], [0*DPI, 15*DPI], 150, 4);
    intersection(compare_bindings(bindings, anchors, 150), 4)
    circle([60, 20], 2, [0,255,0,255], 4)
    buffer = context.getImageData(0, 0, canvas.width, canvas.height);
    console.log(get_pixel_color(60, 20))
    console.log(get_saturation(60, 20))
});
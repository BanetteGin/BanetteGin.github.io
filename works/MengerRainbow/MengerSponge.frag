precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 vTexCoord;

const float PI = acos(-1.);
const float TAU = 2. * PI;
const float EPS = 1e-4;

const int STEP = 128;

const int oct = 16;

#define ITERATOR_MAX 10000
#define saturate(x) clamp(x, 0.1, 1.0)

mat3 v3rotate(vec3 theta) {
    mat3 rx = mat3(
        1.0, 0.0, 0.0,
        0.0, cos(theta.x), - sin(theta.x),
        0, sin(theta.x), cos(theta.x)
    );
    mat3 ry = mat3(
        cos(theta.y), 0.0, sin(theta.y),
        0.0, 1.0, 0.0,
        - sin(theta.y), 0.0, cos(theta.y)
    );
    mat3 rz = mat3(
        cos(theta.z), - sin(theta.z), 0.0,
        sin(theta.z), cos(theta.z), 0.0,
        0.0, 0.0, 1.0
    );
    return rz * ry * rx;
}

float Menger_sponge(vec3 p, vec3 offset, float scale) {
    vec4 z = vec4(p, 1.0);
    const int iter = 5;
    for (int i = 0; i < iter; i++) {
        z.xyz *= v3rotate(vec3(u_time / 5.));
        z = abs(z);
        if (z.x < z.y) z.xy = z.yx;
        if (z.x < z.z) z.xz = z.zx;
        if (z.y < z.z) z.yz = z.zy;
        z *= scale;
        z.xyz -= offset * (scale - 1.0);
        if (z.z < -0.5 * offset.z * (scale - 1.0)) z.z += offset.z * (scale - 1.0);
    }
    return (length(max(abs(z.xyz) - vec3(1.0, 1.0, 1.0), 0.0))) / z.w;
}

float distance_function(vec3 p) {
    return Menger_sponge(p, vec3(1.), 3.);
}

vec3 get_normal(vec3 p) {
    vec2 d = vec2(EPS, 0.);
    return normalize(vec3(
        distance_function(p + d.xyy) - distance_function(p - d.xyy),
        distance_function(p + d.yxy) - distance_function(p - d.yxy),
        distance_function(p + d.yyx) - distance_function(p - d.yyx)
    ));
}

vec3 HSVtoRGB(vec3 hsv){
    return ((clamp(abs(fract(hsv.x+vec3(0,2,1)/3.)*6.-3.)-1.,0.,1.)-1.)*hsv.y+1.)*hsv.z;
}

float random_fractsin_2t1_anim(vec2 p, float speed){
    return sin(u_time * speed + fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453) * 2. * PI) * 0.5 + 0.5;
}

float block_noise(vec2 p){
    return random_fractsin_2t1_anim(floor(p), 2.);
}

float block_noise_fBm(vec2 p){
    float value = 0.0;
    float amp = .5;
    for (int i = 0; i < oct; i++) {
        value += amp * block_noise(p);
        p *= 2.;
        amp *= .5;
    }
    return value;
}

void main(void) {
    vec2 p = vTexCoord;
    p = p * 2.0 - 1.0;
    p.x *= u_resolution.x / u_resolution.y;
    vec2 m = (u_mouse.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);

    vec3 color = vec3(1.0);

    vec3 cam_pos = vec3(0.0, 0.0, 2.0);

    const float angle = 60.0;
    const float fov = angle * 0.5 * PI / 180.0;
    const vec3 light_dir = normalize(vec3(7.,6.,4.));

    vec3 ray = normalize(vec3(sin(fov) * p.x, sin(fov) * p.y, - cos(fov)));

    float distance = 0.0;
    float ray_len = 0.0;
    vec3 ray_pos = cam_pos;

    for(int i = 0; i < STEP; i++) {
        distance = distance_function(ray_pos);
        ray_pos += distance * ray * 0.2;
    }
    if (abs(distance) < EPS) {
        vec3 normal = get_normal(ray_pos);
        float colorVal = (normal.x + normal.y + normal.z) / 3.;
        float lightVal = max(1.0, dot(light_dir, normal));

        float v = block_noise_fBm(p * 16.);
        float k = 1. / abs(sin(u_time)) - 1.;
        color = HSVtoRGB(vec3(colorVal + k * (colorVal - v), 1.0, lightVal));
    }
    gl_FragColor = vec4(color, 1.0);
}
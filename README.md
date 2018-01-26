# CIS 566 Project 1: Noisy Planets

## Student Info

- Name: Mauricio Mutai
- PennKey: `mmutai`

## Live Demo

- Click below for the live demo!

[![](img/lava.gif)](https://maukmu.github.io/homework-1-noisy-planets-MauKMu/)

## Techniques Used

### General Planet Behavior

- I was inspired by the idea of using **Worley noise** to split my planet into different "biomes". I believe this idea was mentioned in class, and I also remember discussing it in CIS460 last semester.
- However, instead of traditional biomes (e.g. Minecraft), I wanted to do something slightly different. My initial idea was to have an "urban biome", where buildings would appear of instead of natural geographic features. The ideas was that the natural and urban biomes would "fight" each other.
  - I had some difficulty of making these buildings look like real buildings. Eventually, a TA suggested that I should scrap the idea and work on another biome. The partial implementation of this is available under the "Urban Planet" shader.
  - Instead, I implemented a "lava" biome, which still "fights" with the hill-like natural biome.
  - This shader is implemented in "Plumous Planet" (the reason for this name should become clear soon).
- For a given vertex `v` in the vertex shader, I compute a time-dependent Worley noise value based on `v`'s position. This is scaled and becomes `f`, the biome factor.
- The biomes are approximately determined by `f` (with default settings) as follows:
  - `f < 0.33`: lava biome
  - `0.33 <= f < 0.67`: plain biome
  - `0.67 <= f`: hilly biome
- Because `f` is time-depdent, `v` will be part of different biomes as time passes.
- Within a biome, `f` is used to interpolate between that biomes and its neighbors.

### Natural Biomes (Plain and Hilly)

- This biome uses a **3D Perlin noise** function as a basis for its height field. The noise is summed using the **FBM** method to make it more smooth.
- An approximation of the normal is computed using the gradient of the noise.
- There are two differences between the plain and hilly biomes:
  - Let `n` be the noise computed for `v`. The final height by which `v` is displaced is of the form `K * n ^ E`, where `K` and `E` increase with `f` in order to make higher values of `f` give sharper and higher terrain.
  - The color of `v` is interpolated from brown-ish (plain) to green (hilly) using `f`.
- This terrain uses regular **Lambert shading**.

### Lava Biome

- This biome uses another layer of **Worley noise**, but a time-independent one. This is because we want a fixed "Worley point" (i.e. closest neighbor when computing Worley noise).
- This biome is supposed to have "lava plumes", or at least an approximation of them. They essentially look like very viscous lava splashing up.
- These plumes are animated based on the Worley point (the center of the plume has the same radial direction as the Worley point), hence the need for it to be constant.
    - This means decreasing the Worley grid size increases the number of plumes (see "Controls" below).
    - The maximum height of the plume and the time offset (used so plumes don't all animate in sync) are each generated using a **"raw" 3D noise** function from Patrick Gonzalez Vivo. 
- The animation is achieved by interpolating three "keyframes".
- In order to make the lava look more lava-like, the fragment shader does the following: 
    - Compute a time-dependent **Worley noise** value using the interpolated `fs_Pos` obtained from the the rasterizer.
    - "Edges" in the Worley noise (see IQ's article below) are assigned a red color, and the inside of the cells is assigned an orange color. These two are blended together based on the point's distance to the edge.
    - In addition, a lava normal is computed using the **FBM-summed 3D Perlin noise**. This normal is used for **Blinn-Phong** shading to make the lava shiny.

### "Shininess"

- `fs_Shininess` is used in the fragment shader as a "hint" as to whether the fragment is part of a lava biome.
## Controls

- Below is an explanation of the options on the GUI:
  - `shader`: Pick which shader to use.
  - `shaderSpeed`: Choose how fast the shader animates. Lets you pause. (Disabled for "Cool Custom" shader)
  - `lavaBias`: As this increases, lava becomes more prominent (lava biome more likely to appear).
  - `plumeBias`: As this increases, lava plumes appear more often (Worley lava cells shrink).
  - `edgeClarity`: As this increases, edges of Worley lava cells becomes sharper (less blending with inner cell color).
  - `Light Position`: `lightX`,  `lightY`, and  `lightZ` determine the light's position. 

## Bonus Shaders

- Both of these essentially replace the lava biome with a new biome.
  - "Urban Planet": As mentioned above, a partial implementation of my idea of having an urban biome. Buildings are white and shiny, and have (mostly) straight walls. They look smoother with higher tessellation levels.
  - "Magic Plumous Planet": While debugging, I tried coloring the lava with its normals, and though the result looked very interesting. Instead of lava pools, I like to think it's some sort of magic potion reservoir that would do weird things if you fell in it (not unlike Banjo-Tooie's transformation mechanic).


## External References

- [IQ's article about "Voronoi Edges"](http://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm)
- [Patricio Gonzales Vivo's Gist about noise](https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83)
- Advice from Dan, Charles, Chloe.


## Objective
- Continue practicing WebGL and Typescript
- Experiment with noise functions to procedurally generate the surface of a planet
- Review surface reflection models

## Base Code
You'll be using the same base code as in homework 0.

## Assignment Details
- Update the basic scene from your homework 0 implementation so that it renders
an icosphere once again. We recommend increasing the icosphere's subdivision
level to 6 so you have more vertices with which to work.
- Write a new GLSL shader program that incorporates various noise functions and
noise function permutations to offset the surface of the icosphere and modify
the color of the icosphere so that it looks like a planet with geographic
features. Try making formations like mountain ranges, oceans, rivers, lakes,
canyons, volcanoes, ice caps, glaciers, or even forests. We recommend using
3D noise functions whenever possible so that you don't have UV distortion,
though that effect may be desirable if you're trying to make the poles of your
planet stand out more.
- Implement various surface reflection models (e.g. Lambertian, Blinn-Phong,
Matcap/Lit Sphere, Raytraced Specular Reflection) on the planet's surface to
better distinguish the different formations (and perhaps even biomes) on the
surface of your planet. Make sure your planet has a "day" side and a "night"
side; you could even place small illuminated areas on the night side to
represent cities lit up at night.
- Add GUI elements via dat.GUI that allow the user to modify different
attributes of your planet. This can be as simple as changing the relative
location of the sun to as complex as redistributing biomes based on overall
planet temperature. You should have at least three modifiable attributes.
- Have fun experimenting with different features on your planet. If you want,
you can even try making multiple planets! Your score on this assignment is in
part dependent on how interesting you make your planet, so try to
experiment with as much as you can!

For reference, here is a planet made by your TA Dan last year for this
assignment:

![](danPlanet.png)

Notice how the water has a specular highlight, and how there's a bit of
atmospheric fog near the horizon of the planet. This planet used only simple
Fractal Brownian Motion to create its mountainous shapes, but we expect you all
can do something much more exciting! If we were to grade this planet by the
standards for this year's version of the assignment, it would be a B or B+.

## Useful Links
- [Implicit Procedural Planet Generation](https://static1.squarespace.com/static/58a1bc3c3e00be6bfe6c228c/t/58a4d25146c3c4233fb15cc2/1487196929690/ImplicitProceduralPlanetGeneration-Report.pdf)
- [Curl Noise](https://petewerner.blogspot.com/2015/02/intro-to-curl-noise.html)
- [GPU Gems Chapter on Perlin Noise](http://developer.download.nvidia.com/books/HTML/gpugems/gpugems_ch05.html)
- [Worley Noise Implementations](https://thebookofshaders.com/12/)


## Submission
Commit and push to Github, then submit a link to your commit on Canvas.

For this assignment, and for all future assignments, modify this README file
so that it contains the following information:
- Your name and PennKey
- Citation of any external resources you found helpful when implementing this
assignment.
- A link to your live github.io demo (we'll talk about how to get this set up
in class some time before the assignment is due)
- At least one screenshot of your planet
- An explanation of the techniques you used to generate your planet features.
Please be as detailed as you can; not only will this help you explain your work
to recruiters, but it helps us understand your project when we grade it!

## Extra Credit
- Use a 4D noise function to modify the terrain over time, where time is the
fourth dimension that is updated each frame. A 3D function will work, too, but
the change in noise will look more "directional" than if you use 4D.
- Use music to animate aspects of your planet's terrain (e.g. mountain height,
  brightness of emissive areas, water levels, etc.)
- Create a background for your planet using a raytraced sky box that includes
things like the sun, stars, or even nebulae.

Continue my existing RoomCraft project. Phase 1 and Phase 2 are complete. The application already uses React, Vite, Tailwind CSS, React Konva, Konva, and lucide-react. It has a working editor shell, rectangle and square rooms, trapezoid room support, canonical millimeter geometry, furniture catalog and placement, object selection/movement/rotation/resizing, object properties, collision detection, unit switching, canvas zoom/pan, tests, and localStorage persistence.

Implement PHASE 3 ONLY: advanced room geometry, L-shaped and custom polygon rooms, editable wall geometry, and proper wall-mounted doors/windows. Inspect the existing repository and read the current implementation before modifying anything. Preserve existing working features, existing data formats where possible, and existing component conventions. Do not recreate the project or rewrite working files unnecessarily.

A. GEOMETRY FOUNDATION
Review the existing room geometry and units utilities. Establish a consistent room-local coordinate system in millimeters, with polygon vertices ordered consistently and an explicitly defined coordinate convention. Build reusable geometry functions for polygon area, perimeter, edge lengths, point-in-polygon, segment intersection, polygon self-intersection detection, and point projection onto a wall. Add tests before relying on these functions in UI components.

B. L-SHAPED ROOMS
Add an L-shaped room option in the existing Room Shape interface. Let the user enter overall width and height plus horizontal and vertical offsets, or equivalent six-vertex measurements. Validate that dimensions are positive, edges are valid, and the resulting polygon is simple and non-degenerate. Draw the room to scale, calculate its exact floor area and perimeter, and label individual wall lengths. Do not change the room dimensions silently when input is invalid.

C. CUSTOM POLYGON ROOMS
Add a custom polygon creation workflow. Allow users to add, select, move, and edit vertices, and to enter vertex coordinates or wall lengths where the geometry is sufficiently constrained. Support a clear close-polygon action and prevent accidental self-intersections. If wall lengths alone do not uniquely determine the room, ask for additional coordinates, angles, diagonals, or other constraints. Show useful validation errors and a cancel/reset option. Do not make arbitrary guesses about missing geometry.

D. WALL SELECTION AND INSPECTOR
Represent each room wall as a stable edge derived from the room polygon. Make individual walls selectable and visually highlight the selected wall. Show its index or label, length, direction, and endpoints in the properties panel. Allow editing a wall length only through a geometrically valid operation. For unconstrained polygons, offer endpoint/vertex editing or request sufficient constraints instead of distorting other walls unexpectedly. Keep the room closed and valid after accepted changes.

E. WALL-MOUNTED DOORS AND WINDOWS
Create a separate architectural opening data model, distinct from ordinary free-standing furniture. Each opening should store a stable ID, opening type, host wall identifier, offset along the wall in millimeters, width in millimeters, and relevant properties such as door swing direction or window style. Add commands to select a wall and insert a door/window, or attach an opening to a selected wall. Position the opening along the wall using an offset and render it aligned to the wall orientation. Show the opening's width and offset in the properties inspector. Prevent openings from exceeding wall length, becoming negative, or overlapping other openings on the same wall. Ensure openings follow their host wall when valid geometry edits move or change that wall; if a host wall becomes invalid, report the issue and request correction rather than silently relocating the opening.

F. VISUAL WALL OPENINGS
Render wall openings as actual gaps or clearly represented openings in the thick wall geometry, not merely as a door icon floating inside the room. Render a recognizable door leaf and swing arc, and window frame/glazing lines aligned with the wall. Avoid duplicate drawing of the wall beneath an opening. Account for wall thickness and ensure labels remain readable when zooming. Preserve the current room grid, dimension annotations, pan, zoom, and fit-to-room behavior.

G. ROOM AND OBJECT COMPATIBILITY
Keep the existing furniture layer, selection, transformation controls, unit conversion, collision warnings, room presets, autosave, and restore behavior. Ensure existing furniture remains in the correct position after adding or editing room vertices. Define how room-shape changes affect out-of-bounds furniture and display warnings rather than unexpectedly deleting or moving furniture. Migrate stored room data safely if the schema must change. Preserve backward compatibility with existing saved rectangle and trapezoid layouts.

H. TESTING
Add automated tests for L-shaped room area/perimeter, polygon closure and validation, concave polygons, self-intersections, zero-length edges, wall length calculations, point-on-wall projection, opening offset/width validation, opening overlap, and safe persistence migration. Test regression cases for rectangles, trapezoids, furniture movement, collision detection, unit conversion, zoom/pan, and localStorage save/restore.

I. IMPLEMENTATION RULES
Use reusable modules and keep geometry logic outside React presentation components. Avoid giant components, duplicate state, unnecessary dependencies, remote images, and nonfunctional placeholder controls. Do not implement 3D, cloud storage, or unrelated features in this phase. Implement incrementally and inspect the browser when available.

J. VERIFY AND REPORT
Run npm test, npm run lint, and npm run build using the existing package scripts. Fix regressions and runtime errors. Report changed files, completed features, test results, build results, and remaining limitations. Only claim browser verification if it was actually performed. Provide exact instructions for manually testing L-shaped rooms, custom polygons, wall selection, and wall-mounted doors/windows.

Start by inspecting the existing room model, RoomCanvas.jsx, LeftSidebar.jsx, RightPropertiesPanel.jsx, catalog.js, units.js, validation.js, collision.js, storage.js, and existing tests. Then implement the smallest complete and verified Phase 3 increment without breaking Phases 1 and 2.

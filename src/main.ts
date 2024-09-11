import {
    exportToDirectory,
	importDirectory,
	cleanupSVG,
	runSVGO,
	deOptimisePaths,
	scaleSVG,
	resetSVGOrigin,
	removeFigmaClipPathFromSVG,
	convertSVGToMask,
} from '@iconify/tools';
import fs from "node:fs/promises";
import svgtofont from 'svgtofont';
import { createTTF } from 'svgtofont/lib/utils';
import path from "node:path"

const start_char=33;

(async () => {
	// Import icons
	const iconSet = await importDirectory('src/svg', {
		prefix: 'ntchrono_fonts',
	});

	// Validate, clean up, fix palette and optimise
	let character = start_char;
	iconSet.forEach((name, type) => {
		if (type !== 'icon') {
			console.log(`${name} type: ${type}`);
//			return;
		}

		const svg = iconSet.toSVG(name);
		if (!svg) {
			// Invalid icon
			iconSet.remove(name);
			console.log(`${name} invalid`);
			return;
		}

		// Clean up and optimise icons
		try {
			// Clean up icon code
			cleanupSVG(svg);
			// Optimise
			runSVGO(svg,{
				keepShapes: true,
			});
			deOptimisePaths(svg);
			resetSVGOrigin(svg);
			console.log(`SVG ${name} ${svg.viewBox.width}x${svg.viewBox.height} -> 48x48`);
			scaleSVG(svg,48/svg.viewBox.width);
			removeFigmaClipPathFromSVG(svg);
			//
		} catch (err) {
			// Invalid icon
			console.error(`Error parsing ${name}:`, err);
			iconSet.remove(name);
			return;
		}

		// Update icon
		iconSet.fromSVG(name, svg);
		iconSet.toggleCharacter(name,String.fromCharCode(character++),true);
	});

	console.log(`Exported ${character-33} chars in map!`);


    // Export as IconifyJSON
   const exported = JSON.stringify(iconSet.export(), null, '\t') + '\n';

   // Save to file
   await fs.mkdir("dist/fonts",{
    recursive: true
   });
   await fs.writeFile(`dist/fonts/${iconSet.prefix}.json`, exported, 'utf8');


   await exportToDirectory(iconSet, {
    target: `dist/fonts/${iconSet.prefix}`,
	cleanup: true,
	autoHeight: false,
	includeAliases: true,
	includeChars: false,
    log: false,
    });


	// Generated Iconset
	//console.log(iconSet.export());
   // TTF Generation




   svgtofont({
    src: path.resolve(process.cwd(),  `dist/fonts/${iconSet.prefix}/`), // svg path
    dist: path.resolve(process.cwd(), "dist/fonts"), // output path
    //styleTemplates: path.resolve(rootPath, "styles"), // file templates path (optional)
    fontName: iconSet.prefix, // font name
    css: false, // Create CSS files.
    startUnicode: start_char, // unicode start number 
    svgicons2svgfont: {
	  centerHorizontally: true,
	  centerVertically: true,
      fontHeight: 48,
	  descent: 20,
	  ascent: 48-10,
      normalize: true,
      usePathBounds: true,
      fixedWidth: true,
    }
  }).then(() => {
    console.log('done!');
  });

})();
import {
    exportToDirectory,
	importDirectory,
	cleanupSVG,
	runSVGO,
} from '@iconify/tools';
import fs from "node:fs/promises";
import svgtofont from 'svgtofont';
import { createTTF } from 'svgtofont/lib/utils';
import path from "node:path"


(async () => {
	// Import icons
	const iconSet = await importDirectory('src/svg', {
		prefix: 'ntchrono_fonts',
	});

	// Validate, clean up, fix palette and optimise
	iconSet.forEach((name, type) => {
		if (type !== 'icon') {
			return;
		}

		const svg = iconSet.toSVG(name);
		if (!svg) {
			// Invalid icon
			iconSet.remove(name);
			return;
		}

		// Clean up and optimise icons
		try {
			// Clean up icon code
			cleanupSVG(svg);
			// Optimise
			runSVGO(svg);
		} catch (err) {
			// Invalid icon
			console.error(`Error parsing ${name}:`, err);
			iconSet.remove(name);
			return;
		}

		// Update icon
		iconSet.fromSVG(name, svg);
	});


    // Export as IconifyJSON
   const exported = JSON.stringify(iconSet.export(), null, '\t') + '\n';

   // Save to file
   await fs.mkdir("dist/fonts",{
    recursive: true
   });
   await fs.writeFile(`dist/fonts/${iconSet.prefix}.json`, exported, 'utf8');


   await exportToDirectory(iconSet, {
    target: `dist/fonts/${iconSet.prefix}`,
    log: true,
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
    startUnicode: 0x10, // unicode start number 
    svgicons2svgfont: {
      fontHeight: 1000,
      normalize: true,
      usePathBounds: true,
      fixedWidth: true,
    }
  }).then(() => {
    console.log('done!');
  });

})();
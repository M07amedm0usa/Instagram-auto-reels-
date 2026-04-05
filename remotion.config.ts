// remotion.config.ts  –  Remotion Studio & CLI configuration
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');  // faster renders for previewing
Config.setOverwriteOutput(true);

// Point Remotion's static file server at the src/assets folder.
// Place voiceover.mp3 and any other assets here.
Config.setPublicDir('./src/assets');

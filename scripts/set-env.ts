import { writeFile, mkdirSync, existsSync } from 'fs';
import { env } from 'process';

const targetDirectory = './src/environments';
const targetPath = `${targetDirectory}/environment.ts`;

// Check if directory exists, if not create it
if (!existsSync(targetDirectory)) {
    mkdirSync(targetDirectory, { recursive: true });
}

const envConfigFile = `export const environment = {
  production: true,
  supabaseUrl: '${env['SUPABASE_URL'] || ''}',
  supabaseKey: '${env['SUPABASE_KEY'] || ''}'
};
`;

writeFile(targetPath, envConfigFile, (err) => {
    if (err) {
        console.error('Error writing environment.ts:', err);
    } else {
        console.log(`Successfully generated environment.ts at ${targetPath}`);
    }
});

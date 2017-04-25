import path from 'path';
import {spawn} from 'child_process';

export const downloadSubtitles = (
  {lang = 'enUS', filename, url, targetFolder} = {}
) =>
  new Promise(resolve => {
    const dl = spawn(
      'youtube-dl',
      [
        '--write-sub',
        '--sub-lang',
        lang,
        '-o',
        filename,
        '--skip-download',
        url,
      ],
      {
        cwd: targetFolder,
      }
    );
    dl.stderr.on('data', data => console.log('[dl-sub]:', data.toString()));
    dl.stdout.on('close', () => {
      const subtitlesFile = filename.replace('.mp4', `.${lang}.ass`);
      resolve(path.join(targetFolder, subtitlesFile));
    });
  });

export const getStreamUrl = url =>
  new Promise(resolve => {
    const dl = spawn('youtube-dl', ['-g', url]);
    dl.stdout.on('data', data => resolve(data.toString().trim()));
  });

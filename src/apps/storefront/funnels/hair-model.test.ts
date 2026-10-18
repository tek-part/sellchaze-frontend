import { expect, it } from 'vitest';
import { hairVideoEmbed, hairVideoFile } from './hair-model';

it('embeds only valid YouTube identifiers on the privacy domain', () => {
  for (const url of ['https://youtu.be/abcdefghijk', 'https://www.youtube.com/watch?v=abcdefghijk', 'https://youtube-nocookie.com/embed/abcdefghijk']) expect(hairVideoEmbed(url)).toBe('https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0');
  for (const url of ['javascript:alert(1)', 'http://youtu.be/abcdefghijk', 'https://youtube.com.evil.test/watch?v=abcdefghijk', 'https://user:secret@youtube.com/watch?v=abcdefghijk', 'https://youtube.com:444/embed/abcdefghijk', 'https://youtu.be/short', 'https://youtu.be/abcdefghijk/extra']) expect(hairVideoEmbed(url)).toBeNull();
});

it('accepts secure video files without treating arbitrary pages as playable media', () => {
  expect(hairVideoFile('https://cdn.example.test/video.mp4?token=demo')).toBe('https://cdn.example.test/video.mp4?token=demo');
  for (const url of ['http://cdn.example.test/video.mp4', '/media/video.mp4', 'https://user:pass@example.test/video.mp4', 'https://example.test/video.html', null]) expect(hairVideoFile(url)).toBeNull();
});

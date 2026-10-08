"""Verify or restore the exact captured production site without rebuilding stale source."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import stat
import zipfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--output', default='production-site')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    meta = json.loads((root / 'production/baseline.json').read_text(encoding='utf-8'))
    archive = root / 'production' / meta['archive']
    if hashlib.sha256(archive.read_bytes()).hexdigest() != meta['archiveSha256']:
        raise SystemExit('Production archive checksum mismatch.')
    output = (root / args.output).resolve()
    if not args.verify_only and (not output.is_relative_to(root) or output == root or output.exists()):
        raise SystemExit('Output must be a new directory inside this repository; existing files are never overwritten.')
    with zipfile.ZipFile(archive) as z:
        entries = z.infolist()
        names = [entry.filename for entry in entries]
        if len(names) != len(set(names)) or set(names) != set(meta['files']):
            raise SystemExit('Archive file list differs from the production manifest.')
        for entry in entries:
            path = PurePosixPath(entry.filename)
            if path.is_absolute() or '..' in path.parts or '\\' in entry.filename or ':' in entry.filename:
                raise SystemExit('Unsafe archive path: ' + entry.filename)
            if stat.S_ISLNK(entry.external_attr >> 16):
                raise SystemExit('Symbolic links are not allowed in the production archive.')
            data = z.read(entry)
            expected = meta['files'][entry.filename]
            if len(data) != expected['size'] or hashlib.sha256(data).hexdigest() != expected['sha256']:
                raise SystemExit('File checksum mismatch: ' + entry.filename)
        print('Verified', len(names), 'production files from', meta['capturedAt'])
        if not args.verify_only:
            z.extractall(output)
            print('Restored to', output)
    print('Source parity:', meta['sourceParity'], '— npm run build still builds the older source tree.')


if __name__ == '__main__':
    main()

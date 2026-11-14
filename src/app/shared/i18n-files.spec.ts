import es from '../../../public/i18n/es.json';
import en from '../../../public/i18n/en.json';

/**
 * Protege los textos de la app (public/i18n): ambos idiomas deben tener las mismas claves y el
 * código solo debe pedir claves que existan. Si falla, el mensaje dice qué clave corregir.
 */
type Tree = { [key: string]: string | Tree };

/** Textos finales ("a.b.c" → texto), recorriendo los objetos anidados. */
function leaves(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else leaves(value, path).forEach((text, k) => out.set(k, text));
  }
  return out;
}

/** Grupos ("a.b") que existen como objeto: sirven para claves armadas como 'a.b.' + valor. */
function groups(tree: Tree, prefix = ''): Set<string> {
  const out = new Set<string>();
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string') continue;
    const path = prefix ? `${prefix}.${key}` : key;
    out.add(path);
    groups(value, path).forEach((g) => out.add(g));
  }
  return out;
}

const params = (text: string): string[] =>
  [...text.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]).sort();

const esLeaves = leaves(es as Tree);
const enLeaves = leaves(en as Tree);

describe('Archivos de traducción (es / en)', () => {
  it('es y en tienen exactamente las mismas claves', () => {
    const soloEs = [...esLeaves.keys()].filter((k) => !enLeaves.has(k));
    const soloEn = [...enLeaves.keys()].filter((k) => !esLeaves.has(k));
    expect({ faltanEnEn: soloEs, faltanEnEs: soloEn }).toEqual({ faltanEnEn: [], faltanEnEs: [] });
  });

  it('cada clave usa los mismos parámetros {{x}} en los dos idiomas', () => {
    const distintos = [...esLeaves.keys()]
      .filter((k) => enLeaves.has(k))
      .filter((k) => params(esLeaves.get(k)!).join() !== params(enLeaves.get(k)!).join());
    expect(distintos).toEqual([]);
  });

  it('ningún texto está vacío', () => {
    const vacios = [...esLeaves, ...enLeaves]
      .filter(([, text]) => text.trim() === '')
      .map(([k]) => k);
    expect(vacios).toEqual([]);
  });
});

// --- Claves usadas en el código ------------------------------------------------------------

interface NodeFs {
  readdirSync(
    path: string,
    options: { withFileTypes: true },
  ): { name: string; isDirectory(): boolean }[];
  readFileSync(path: string, encoding: 'utf-8'): string;
}

/** Archivos .ts / .html de producción (sin specs) bajo src/. Solo corre en Node, con ng test. */
async function sourceFiles(): Promise<{ path: string; text: string }[]> {
  const specifier = 'node:fs'; // variable a propósito: el compilador no la trata como import del navegador
  const fs = (await import(/* @vite-ignore */ specifier)) as NodeFs;
  const root = (globalThis as unknown as { process: { cwd(): string } }).process.cwd();
  const files: { path: string; text: string }[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
        files.push({ path: path.replace(`${root}/`, ''), text: fs.readFileSync(path, 'utf-8') });
      }
    }
  };
  walk(`${root}/src`);
  return files;
}

describe('Claves de traducción usadas en el código', () => {
  const namespaces = new Set([...esLeaves.keys()].map((k) => k.split('.')[0]));
  const KEY = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_-]+)+\.?$/;
  const esGroups = groups(es as Tree);
  const enGroups = groups(en as Tree);

  it('todas existen en es y en', async () => {
    const files = await sourceFiles();
    expect(files.length).toBeGreaterThan(50);

    const problemas: string[] = [];
    for (const { path, text } of files) {
      const quotes = path.endsWith('.html')
        ? /(['`])((?:\\.|(?!\1)[^\\\n])*?)\1/g
        : /(['"`])((?:\\.|(?!\1)[^\\\n])*?)\1/g;
      for (const m of text.matchAll(quotes)) {
        const literal = m[2];
        const dynamic = literal.includes('${');
        const key = dynamic ? literal.split('${')[0] : literal;
        if (!KEY.test(key) || !namespaces.has(key.split('.')[0])) continue;

        const followedByPlus = /^\s*\+/.test(text.slice(m.index! + m[0].length));
        if (key.endsWith('.') || followedByPlus || dynamic) {
          // Clave armada en tiempo de ejecución: al menos el grupo debe existir.
          const group = key.replace(/\.$/, '');
          if (!esGroups.has(group) || !enGroups.has(group))
            problemas.push(`${path}: el grupo "${group}" no existe`);
        } else if (!esLeaves.has(key) || !enLeaves.has(key)) {
          const donde =
            !esLeaves.has(key) && !enLeaves.has(key) ? 'es y en' : esLeaves.has(key) ? 'en' : 'es';
          problemas.push(`${path}: falta "${key}" en ${donde}`);
        }
      }
    }
    expect(problemas).toEqual([]);
  });
});

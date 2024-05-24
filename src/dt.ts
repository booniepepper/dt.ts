const { stdin, stdout, stderr } = process;
import * as readline from 'readline';
import { appendFileSync, writeFileSync } from 'fs';
import {version} from '../package.json';
const write = (s: any, stream: NodeJS.WriteStream = stdout) => stream.write(`${s}`);
const writeln = (s: any, stream: NodeJS.WriteStream = stdout) => stream.write(`${s}\n`);
const reader = function*() {
    const rl = readline.createInterface({ input: stdin });
    for (let line in rl) yield line;
}();
const readln = () => reader.next().value;

type State = {
    stack: any[];
    depth: number;
};
type StateFn = (state: State) => State;
type unimplemented = 'UNIMPLEMENTED';
const UNIMPLEMENTED = 'UNIMPLEMENTED';
type quit = 'QUIT';
const QUIT = 'QUIT';

const deeper = (state: State): State =>
    ({ ...state, stack: [...state.stack, []], depth: state.depth + 1});

const undeep = (state:State): State =>
    ({ ...state, depth: state.depth - 1 });

const popOff = (n: number) => (xform: (vals: any[]) => any[]) => (state: State): State => {
    if (n > state.stack.length) throw 'Stack Underflow.';
    const base: any[] = state.stack.slice(0, -n);
    const vals: any[] = state.stack.slice(-n);

    return { ...state, stack: base.concat(xform(vals)) };
}
const on = ({
    0: (fn: () => any[]): StateFn => popOff(0)(fn),
    1: (fn: (a: any) => any[]): StateFn => popOff(1)(fn),
    2: (fn: (a: any, b: any) => any[]): StateFn => popOff(2)(([a, b]) => fn(a, b)),
    3: (fn: (a: any, b: any, c:any) => any[]): StateFn => popOff(3)(([a, b, c]) => fn(a, b, c)),
});

export const printlns = (a: any, stream: NodeJS.WriteStream = stdout) =>
    a instanceof Array ? a.forEach(v => writeln(v, stream)) : writeln(a, stream);

const multikey = (keys: any[], value: any) => keys.reduce((acc, key) => Object.assign(acc, { [key]: value}), {});

const as = ({
    quote: (a: any): any[] => a instanceof Array ? a : [a],
    string: (a: any): string => typeof a == 'string' ? a : JSON.stringify(a),
});

export const builtins: Record<string, StateFn | unimplemented | quit> = {
    '+': on[2]((a, b) => [a + b]),
    '-': on[2]((a, b) => [a - b]),
    '*': on[2]((a, b) => [a * b]),
    '/': on[2]((a, b) => [a / b]),
    '%': on[2]((a, b) => [a % b]),
    '.': on[1](a => { write(`${a} `); return [] }), // A forth-ism to write with a space appended.
    '...': on[1](a => a),
    ':': UNIMPLEMENTED,
    'abs': on[1](a => [~~a]),
    'alias': UNIMPLEMENTED,
    'and': on[2]((a, b) => [a && b]),
    'any?': UNIMPLEMENTED,
    'anything?': (state: State) => ({ ...state, stack: [...state.stack, state.stack.length != 0] }),
    'appendf': on[2]((contents, filename) => { appendFileSync(filename, contents); return [] }),
    'args': on[0](() => [process.argv]),
    'assert-true': on[2]((cond, failmsg) => { if (cond) return []; writeln(failmsg, stderr); process.exit(1); }),
    'cd': on[1](dir => { process.chdir(dir); return [] } ),
    'chars': on[1](str => [str.split('')]),
    'concat': on[2]((a, b) => [as.quote(a).concat(as.quote(b))]),
    'contains?': on[2]((haystack, needle) => [haystack instanceof String ? haystack.includes(needle) : as.quote(haystack).includes(needle)]),
    'cwd': on[0](() => [process.cwd]),
    'def': UNIMPLEMENTED,
    'def!': UNIMPLEMENTED,
    'def-usage': UNIMPLEMENTED,
    'def?': UNIMPLEMENTED,
    'define': UNIMPLEMENTED,
    'defs': UNIMPLEMENTED,
    'deq': on[1](a => [a.pop(), a]),
    'divisor?': on[2]((a, b) => [a % b == 0]),
    'do': UNIMPLEMENTED,
    'do!': UNIMPLEMENTED,
    'do!?': UNIMPLEMENTED,
    'do?': UNIMPLEMENTED,
    'doin': UNIMPLEMENTED,
    'downcase': on[1](a => [a instanceof String ? a.toLowerCase() : a]),
    'drop': on[1](_ => []),
    'dup': on[1](a => [a, dumbClone(a)]),
    'each': UNIMPLEMENTED,
    'ends-with?': on[2]((str, suffix) => [str instanceof String && str.endsWith(suffix)]),
    'enl': on[0](() => { writeln('', stderr); return [] }),
    'enq': on[2]((a, b) => [[...a, b]]),
    ...multikey(['eprint', 'ep'], on[1](a => { write(a, stderr); return [] })),
    ...multikey(['eprintln', 'epl'], on[1](a => { writeln(a, stderr); return [] })),
    ...multikey(['eprintlns', 'epls'], on[1](a => { printlns(a, stderr); return [] })),
    'eq?': on[2]((a, b) => [a == b]),
    'eval': UNIMPLEMENTED,
    'even?': on[1](a => [a % 2 == 0]),
    'exec': UNIMPLEMENTED,
    'exit': on[1](code => process.exit(code)),
    'filter': UNIMPLEMENTED,
    'first': on[1](a => [as.quote(a)[0]]),
    'green': UNIMPLEMENTED,
    'gt?': on[2]((a, b) => [a > b]),
    'gte?': on[2]((a, b) => [a >= b]),
    'help': on[0](() => { writeln('Built-in help coming soon. In the meantime: https://dt.plumbing', stderr); return [] }),
    'inspire': UNIMPLEMENTED,
    'interactive?': UNIMPLEMENTED,
    'join': on[2]((a, b) => [as.quote(a).map(as.string).join(as.string(b))]),
    'last': on[1](a => { const q = as.quote(a); return [q[q.length-1]]; }),
    'len': on[1](a => [Object.hasOwn(a, 'length') ? a.length : (a !== null || a !== undefined) ? 1 : 0 ]),
    'lines': on[1](s => [as.string(s).split('\n')]),
    'loop': UNIMPLEMENTED,
    'ls': UNIMPLEMENTED,
    'lt?': on[2]((a, b) => [a < b]),
    'lte?': on[2]((a, b) => [a <= b]),
    'map': UNIMPLEMENTED,
    'nand': on[2]((a, b) => [!(a && b)]),
    'neq?': on[2]((a, b) => [a != b]),
    'nl': on[0](() => { writeln(''); return []; }),
    'nor': on[2]((a, b) => [!(a || b)]),
    'norm': UNIMPLEMENTED,
    'not': on[1](a=> [!a]),
    'odd?': on[1](a => [a % 2 == 1]),
    'or': on[2]((a, b) => [a || b]),
    'parse-csv': UNIMPLEMENTED,
    'pop': on[1](a => { const q = as.quote(a); return [q.slice(0, -1), q[q.length-1]]}),
    ...multikey(['print', 'p'], on[1](a => { write(a); return [] })),
    ...multikey(['println', 'pl'], on[1](a => { writeln(a); return [] })),
    ...multikey(['printlns', 'pls'], on[1](a => { printlns(a); return [] })),
    'procname': on[0](() => [process.argv0]),
    'push': on[2]((a, b) => [...as.quote(a), b]),
    'pwd': on[0](() => { writeln(process.cwd); return []}),
    'quit': QUIT,
    'quote': on[1](a => [[a]]),
    'quote-all': (state: State) => ({ ...state, stack: [state.stack]}),
    'rand': on[0](() => [Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)]),
    ...multikey(['read-line', 'readln', 'rl'], on[0](() => [readln()])),
    ...multikey(['read-lines', 'readlns', 'rls'], UNIMPLEMENTED),
    'red': UNIMPLEMENTED,
    'repl': UNIMPLEMENTED,
    'rev': on[1](a => [typeof a == 'string' ? a.split('').reverse().join() : a instanceof Array ? a.reverse() : a]),
    'rot': on[3]((a, b, c) => [c, a, b]),
    'shebang-args': UNIMPLEMENTED,
    'sort': UNIMPLEMENTED,
    'split': on[2]((str, delim) => [as.string(str).split(delim)]),
    'starts-with?': on[2]((str, prefix) => [str instanceof String && str.startsWith(prefix)]),
    ...multikey(['status', '.s'], (state: State) => { writeln(JSON.stringify(state.stack), stderr); return state; }),
    'swap': on[2]((a, b) => [b, a]),
    'times': UNIMPLEMENTED,
    'to-bool': on[1](a => [!!a]),
    'to-cmd': UNIMPLEMENTED,
    'to-def': UNIMPLEMENTED,
    'to-float': on[1](a => [Number(a)*1.0]),
    'to-int': on[1](a => [Math.floor(Number(a))]),
    'to-quote': on[1](a => [as.quote(a)]),
    'to-string': on[1](a => [as.string(a)]),
    'undef?': UNIMPLEMENTED,
    'unlines': on[1](a => [as.quote(a).map(as.string).join('/n')]),
    ...multikey(['unquote', '...'], on[1](a => [...as.quote(a)])),
    'unwords': on[1](a => [as.quote(a).map(as.string).join(' ')]),
    'upcase': on[1](a => [as.string(a).toUpperCase()]),
    'usage': UNIMPLEMENTED,
    'version': on[0](() => [version]),
    'while': UNIMPLEMENTED,
    'words': on[1](a => [as.string(a).split(' ')]),
    'writef': on[2]((contents, filename) => { writeFileSync(filename, contents); return []; }),
};

export const run = (terms: string[]): State =>
    // TODO: Tokenize strings
    terms.reduce((state: State, term: string) => {
        const {stack, depth} = state;

        if (term == '[') return deeper(state);
        if (term == ']') return undeep(state);
        if (depth > 0) { stack[stack.length-1].push(term); return state; }
        if (depth < 0) { writeln(state, stderr); throw 'Stack Underflow.'; }

        // Strings (todo)

        // Dictionary
        if (term in builtins) {
            const builtin = builtins[term];
            switch (builtin) {
                case UNIMPLEMENTED: 
                    writeln(`Term is reserved but unimplemented: "${term}"`);
                    return state;
                case QUIT:
                    // todo: warn if stack length is not 0
                    process.exit(1);
                default:
                    return builtin(state);
            }
        }

        // Ok let's just chuck it in.
        try {
            // Numbers, etc.
            stack.push(JSON.parse(term));
        } catch {
            stack.push(term);
        }
        return state;
    },
    { stack: [], depth: 0 }
);

const dumbClone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

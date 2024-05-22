const { stdout, stderr } = process;
const write = (s: any, stream: NodeJS.WriteStream = stdout) => stream.write(`${s}`);
const writeln = (s: any, stream: NodeJS.WriteStream = stdout) => stream.write(`${s}\n`);

type State = {
    stack: any[];
    depth: number;
};
type StateFn = (state: State) => State;

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

export const printlns = (a: any) => a instanceof Array ? a.forEach(v => writeln(v)) : writeln(a);

const multikey = (keys: any[], value: any) => keys.reduce((acc, key) => acc[key] = value, {});

export const builtins: Record<string, StateFn> = {
    '+': on[2]((a, b) => [a + b]),
    '-': on[2]((a, b) => [a - b]),
    '*': on[2]((a, b) => [a * b]),
    '/': on[2]((a, b) => [a / b]),
    //'do': // TODO
    'drop': on[1](_ => []),
    'dup': on[1](a => [a, dumbClone(a)]),
    'swap': on[2]((a, b) => [b, a]),
    'rot': on[3]((a, b, c) => [c, a, b]),
    ...multikey(['status', 's.'], (state: State) => { writeln(state.stack, stderr); return state; }),
    ...multikey(['printlns', 'pls'], on[1](a => { printlns(a); return [] })),
    ...multikey(['println', 'pl'], on[1](a => { writeln(a); return [] })),
    ...multikey(['print', 'p'], on[1](a => { write(a); return [] })),
    '.': on[1](a => { write(`${a} `); return [] }), // A forth-ism to write with a space appended.
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
        if (term in builtins) return builtins[term](state);

        // Ok let's just chuck it in.
        stack.push(JSON.parse(term));
        return state;
    },
    { stack: [], depth: 0 }
);

const dumbClone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

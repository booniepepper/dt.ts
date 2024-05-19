export const run = (terms: string[]): any[] =>
    terms.reduce((stack: any[], term: string) => {
        if (term.match(/^(\+|\-|)[0-9]+(\.[0-9+])?/)) { stack.push(Number(term)); return stack; }
        let a: any, b: any, c: any;
        switch (term) {
            case '+': stack.push(stack.pop() + stack.pop()); return stack;
            case '-': stack.push(-stack.pop() + stack.pop()); return stack;
            case '*': stack.push(stack.pop() * stack.pop()); return stack;
            case '/': stack.push(1 / stack.pop() * stack.pop()); return stack;
            case 'drop': stack.pop(); return stack;
            case 'dup': a = stack.pop(); stack.push(a); stack.push(dumbClone(a)); return stack;
            case 'swap': [b, a] = [stack.pop(), stack.pop()]; stack.push(b); stack.push(a); return stack;
            case 'rot': [c, b, a] = [stack.pop(), stack.pop(), stack.pop()]; stack.push(c); stack.push(a); stack.push(b); return stack;
            case 'status':
            case '.s': console.debug(stack); return stack;
            case 'printlns':
            case 'pls': a = stack.pop(); if (a instanceof Array) { a.forEach(v => console.log(v)) } else console.log(a); return stack;
            case 'println':
            case 'pl': console.log(stack.pop()); return stack;
            case 'print':
            case 'p':
            case '.': process.stdout.write(stack.pop()); return stack;
        }
        stack.push(JSON.parse(term));
        return stack;
    },
    []
);

const dumbClone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

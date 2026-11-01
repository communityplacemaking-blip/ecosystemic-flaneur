"""Folds the two-direction stylesheet into one world: drops direction B, renames A to w."""
import re, sys

def blocks(css):
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            out.append(('raw', css[i:], None)); break
        # comments before selector
        pre = css[i:j]
        depth, k = 1, j + 1
        while depth:
            if css[k] == '{': depth += 1
            elif css[k] == '}': depth -= 1
            k += 1
        out.append(('rule', pre, css[j + 1:k - 1]))
        i = k
    return out

def fold(css):
    res = []
    for kind, pre, body in blocks(css):
        if kind == 'raw':
            res.append(pre); continue
        m = re.match(r'(\s*(?:/\*.*?\*/\s*)*)(.*)$', pre, re.S)
        lead, sel = m.group(1), m.group(2).strip()
        if sel.startswith('@'):
            inner = fold(body)
            if inner.strip():
                res.append(f'{lead}{sel} {{{inner}}}')
            else:
                res.append(lead)
            continue
        parts = [p.strip() for p in sel.split(',')]
        parts = [p for p in parts if 'data-dir="b"' not in p and '.tile' not in p]
        if not parts:
            res.append(lead); continue
        parts = [p.replace('data-dir="a"', 'data-dir="w"') for p in parts]
        res.append(f'{lead}{", ".join(parts)} {{{body}}}')
    return ''.join(res)

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    open(dst, 'w').write(fold(open(src).read()))

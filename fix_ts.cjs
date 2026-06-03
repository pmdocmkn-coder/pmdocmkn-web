const fs = require('fs');
let c = fs.readFileSync('src/components/InternalLink/LinkInternalPage.tsx', 'utf8');

c = c.replace(/map\(h => h\.rslNearEnd\)/g, 'map(h => h.rslNearEnd!)');
c = c.replace(/a \+ b\.rslNearEnd,/g, 'a + b.rslNearEnd!,');
c = c.replace(/const warnings = \[\];/g, 'const warnings: { month: string, status: string, value: number }[] = [];');

c = c.replace(/import {([^}]+)} from 'lucide-react';/, (match, p1) => {
    if (!p1.includes('AlertTriangle')) {
        return `import { ${p1}, AlertTriangle } from 'lucide-react';`;
    }
    return match;
});

c = c.replace(/onMouseMove={\(e\) => /g, 'onMouseMove={(e: any) => ');
c = c.replace(/onClick={\(e\) => /g, 'onClick={(e: any) => ');

fs.writeFileSync('src/components/InternalLink/LinkInternalPage.tsx', c);
console.log('Fixed');

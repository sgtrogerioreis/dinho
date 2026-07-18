# Logos locais das empresas

As logos usadas nos embeds ficam em:

```text
src/assets/logos/
```

Cada arquivo deve ser um PNG com o nome exatamente igual ao ticker:

```text
PETR4.png
VALE3.png
WEGE3.png
TAEE11.png
```

Padrao recomendado:

- PNG
- fundo transparente
- 128x128 ou 256x256
- ate 20 KB
- nome exatamente igual ao ticker, sem espacos e sem nome completo da empresa

Para adicionar uma nova empresa, copie o PNG para `src/assets/logos/`.
Depois disso, comandos como `/graham PETR4` passam a anexar a imagem automaticamente quando `src/assets/logos/PETR4.png` existir.

Se a logo nao existir, o embed continua sendo enviado sem thumbnail.

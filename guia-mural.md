# Como funciona o mural de imagens

O mural usa colunas CSS para organizar os cartões em alturas diferentes, como uma parede de fotos. As imagens não precisam ter todas o mesmo formato: o navegador calcula a altura de cada uma a partir das dimensões originais do arquivo.

## Por que algumas ficam altas e outras baixas

No arquivo `styles/index.css`, a regra da imagem é:

```css
.element img {
    display: block;
    width: 100%;
    height: auto;
}
```

`width: 100%` faz a imagem ocupar a largura do cartão. `height: auto` calcula a altura proporcionalmente, sem esticar nem cortar. Uma imagem vertical continua alta; uma imagem horizontal fica mais baixa.

As colunas e os cartões completam o efeito:

```css
.container {
    columns: 5;
    column-gap: 18px;
}

.element {
    display: inline-block;
    width: 100%;
    margin: 0 0 18px;
    break-inside: avoid;
}
```

- `columns: 5` divide o espaço em cinco colunas no desktop.
- `column-gap` define a distância entre as colunas.
- `break-inside: avoid` evita que um cartão seja dividido entre duas colunas.
- As regras `@media` reduzem a quantidade de colunas em telas menores.

## Adicionar outra imagem

Coloque o arquivo dentro da pasta `images/` e adicione um cartão dentro de `.container` no `index.html`:

```html
<div class="element">
    <img src="./images/minha-imagem.jpg" alt="Descrição da imagem">
</div>
```

Use uma descrição breve no `alt` para que leitores de tela possam identificar a imagem. Não é necessário definir uma altura no HTML ou no CSS: `height: auto` preserva a proporção original. Se definir uma altura fixa junto com `object-fit: cover`, a imagem será recortada para preencher esse espaço.
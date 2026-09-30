const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.join(__dirname, "../../styles/login-split.module.css"), "utf8");

const block = (selector) => {
  const start = css.indexOf(selector);
  if (start === -1) return "";
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
};

describe("inputs da tela de login por tema", () => {
  test("tema escuro: fundo cinza quase preto e fonte branca", () => {
    const base = block(".loginPage {");
    expect(base).toMatch(/--field-bg:\s*#1[0-9a-f]1[0-9a-f]1[0-9a-f]\s*;/i);
    expect(base).toMatch(/--field-text:\s*#ffffff\s*;/i);
  });

  test("tema claro: fundo branco e fonte preta", () => {
    const light = block('html[data-theme="light"] .loginPage');
    expect(light).toMatch(/--field-bg:\s*#ffffff\s*;/i);
    expect(light).toMatch(/--field-text:\s*#000000\s*;/i);
  });

  test("o campo e o preenchimento automático usam as variáveis do tema", () => {
    const shell = block(".inputShell {");
    const input = block(".inputShell input {");
    expect(shell).toContain("var(--field-bg)");
    expect(input).toContain("var(--field-text)");
    expect(css).not.toMatch(/#04102b/i);
  });
});

```JSON
{
  "json": {
    "name": "Deno"
  }
}
```

```diff
- hello
+ world
```

- Buildscript

```ts
import { build } from "https://deno.land/x/esbuild/mod.ts";
import sassPlugin from "https://deno.land/x/esbuild_plugin_sass_deno/mod.ts";

build({
  entryPoints: [
    "example/in.ts",
  ],
  bundle: true,
  outfile: "example/out.js",
  plugins: [sassPlugin()],
});
```

- Main Entrypoint File:

```ts
import styles from "./styles.scss";

document.getElementsByTagName("head")[0].innerHTML +=
  `<style>${styles}</style>`;
```

~~Some strikethrough `text`~~

<details>
  <summary>Summary</summary>
  <p>Some Details

**even more details**

</p>
</details>

| Type             | Description                                      | example                           |
| ---------------- | ------------------------------------------------ | --------------------------------- |
| `string`         | A string of characters.                          | `'Hello world'`                   |
| `number`         | A numeric value, either float or integer.        | `42`                              |
| `boolean`        | A boolean value.                                 | `true`                            |
| `enum`           | An enum value.                                   | `'drama'`                         |
| `geopoint`       | A geopoint value.                                | `{ lat: 40.7128, lon: 74.0060 }`  |
| `string[]`       | An array of strings.                             | `['red', 'green', 'blue']`        |
| `number[]`       | An array of numbers.                             | `[42, 91, 28.5]`                  |
| `boolean[]`      | An array of booleans.                            | `[true, false, false]`            |
| `enum[]`         | An array of enums.                               | `['comedy', 'action', 'romance']` |
| `vector[<size>]` | A vector of numbers to perform vector search on. | `[0.403, 0.192, 0.830]`           |

## Math rendering

We support code blocks with the "math" type!

```math
G_{\mu v} = \frac{8 \pi G}{c^4} T_{\mu v}
```

We also support math blocks and inline math blocks as well!

When $a \ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$ and they are

$$ x = {-b \pm \sqrt{b^2-4ac} \over 2a} $$

You can even typeset individual letters or whole sentences inline just like $x$
or $Quadratic \; formula$. You can also use math blocks to typeset whole
equations with $\LaTeX$:

$$ \begin{aligned} \dot{x} & = \sigma(y-x) \\ \dot{y} & = \rho x - y - xz \\
\dot{z} & = -\beta z + xy \end{aligned} $$

# Deno

[![Build Status - Cirrus][]][Build status] [![Twitter handle][]][Twitter badge]
[![Discord Chat](https://img.shields.io/discord/684898665143206084?logo=discord&style=social)](https://discord.gg/deno)

<img align="right" src="https://deno.land/logo.svg" height="150px" alt="the deno mascot dinosaur standing in the rain">

Deno is a _simple_, _modern_ and _secure_ runtime for **JavaScript** and
**TypeScript** that uses V8 and is built in Rust.

### Features

- Secure by default. No file, network, or environment access, unless explicitly
  enabled.
- Supports TypeScript out of the box.
- Ships only a single executable file.
- Built-in utilities like a dependency inspector (deno info) and a code
  formatter (deno fmt).
- Set of reviewed standard modules that are guaranteed to work with
  [Deno](https://deno.land/std/).

### Install

Shell (Mac, Linux):

```sh
curl -fsSL https://deno.land/x/install/install.sh | sh
```

PowerShell (Windows):

```powershell
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

[Homebrew](https://formulae.brew.sh/formula/deno) (Mac):

```sh
brew install deno
```

[Chocolatey](https://chocolatey.org/packages/deno) (Windows):

```powershell
choco install deno
```

[Scoop](https://scoop.sh/) (Windows):

```powershell
scoop install deno
```

Build and install from source using [Cargo](https://crates.io/crates/deno):

```sh
cargo install deno --locked
```

See
[deno_install](https://github.com/denoland/deno_install/blob/master/README.md)
and [releases](https://github.com/denoland/deno/releases) for other options.

### Getting Started

Try running a simple program:

```sh
deno run https://deno.land/std/examples/welcome.ts
```

Or a more complex one:

```ts
const listener = Deno.listen({ port: 8000 });
console.log("http://localhost:8000/");

for await (const conn of listener) {
  serve(conn);
}

async function serve(conn: Deno.Conn) {
  for await (const { respondWith } of Deno.serveHttp(conn)) {
    respondWith(new Response("Hello world"));
  }
}
```

You can find a deeper introduction, examples, and environment setup guides in
the [manual](https://deno.land/manual).

<iframe width="100%" height="600" src="https://embed.deno.com/playground/urlpattern?layout=both"></iframe>

The complete API reference is available at the runtime
[documentation](https://doc.deno.land).

### Contributing

We appreciate your help!

To contribute, please read our
[contributing instructions](https://deno.land/manual/contributing).

[Build Status - Cirrus]: https://github.com/denoland/deno/workflows/ci/badge.svg?branch=main&event=push
[Build status]: https://github.com/denoland/deno/actions
[Twitter badge]: https://twitter.com/intent/follow?screen_name=deno_land
[Twitter handle]: https://img.shields.io/twitter/follow/deno_land.svg?style=social&label=Follow

```tsx
/** @jsx h */
import { h, IS_BROWSER, useState } from "../deps.ts";

export default function Home() {
  return (
    <div>
      <p>
        Welcome to `fresh`. Try update this message in the ./pages/index.tsx
        file, and refresh.
      </p>
      <Counter />
      <p>{IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}</p>
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{count}</p>
      <button
        onClick={() => setCount(count - 1)}
        disabled={!IS_BROWSER}
      >
        -1
      </button>
      <button
        onClick={() => setCount(count + 1)}
        disabled={!IS_BROWSER}
      >
        +1
      </button>
    </div>
  );
}

export const config: PageConfig = { runtimeJS: true };
```

<figure>
  <img src="https://deno.land/logo.svg" />
  <figcaption><b>Figure 1.</b> The deno mascot dinosaur standing in the rain.</figcaption>
</figure>

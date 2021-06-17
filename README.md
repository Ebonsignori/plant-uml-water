# Water PlantUml :seedling::droplet:

[![npm version](https://badge.fury.io/js/water-plant-uml.svg)](https://badge.fury.io/js/water-plant-uml)

CLI tool for live-reloading and/or exporting PlantUML diagrams using the default PlantUML server or a local Docker server.

Install globally via npm with:

```
npm i -g plant-water-uml
```

Begin live reloading a .puml file from your CLI with:

```
water-uml live example.puml
```

### Contents

- [Example Files](https://github.com/Ebonsignori/plant-uml-water/tree/master/examples)
- [Usage](#usage)
- [Markdown](#markdown)
- [Including .puml files with !include](#including-files)
- [Using a local Docker PlantUML server](#using-a-local-docker-plantuml-server)

## Usage

```
Usage: water-uml <command> <filename.puml> [options]

Commands:
  water-uml live    Start live reload server on <reload-port> for filename.puml
  water-uml export  Export filename.puml to filename.<file-type>

Options:
  -p, --live-port      Port live reload server should run on                                    [string] [default: 8088]
  -l, --local          Use local PlantUML server running on localhost:<live-port>             [boolean] [default: false]
  -d, --local-port     Port local PlantUML server is running on                                 [string] [default: 8792]
  -f, --file-type      Output filetype of PlantUML diagram export
                                                          [string] [choices: "svg", "png", "txt", "md"] [default: "svg"]
  -r, --remote-server  Server used for rendering images.          [string] [default: "http://www.plantuml.com/plantuml"]
  -R, --root           Root of your UML files. This allows you to include files from root
                                                          [string] [default: current working dir]
  -o, --output         Output path of export. Defaults to input-file-path.<file-type>                           [string]
  -h, --help           Show help                                                                               [boolean]
      --version        Show version number                                                                     [boolean]

Examples:
  water-uml live example.puml -p 8085                      Run live reload server on localhost:8085
  water-uml live example.puml -l -d 8675                   Runs live reload server on localhost:8088 (default) using
                                                           local PlantUML server on localhost:8675 to render images.
  water-uml export example.puml                            Exports example.puml to example.svg
  water-uml export example.puml -t md                      Exports example.puml as an embeded image in example.md
  water-uml export example.puml -o ~/Diagrams/example.txt  Exports example.puml as an ASCII txt diagram in
```

## Markdown

When exporting to Markdown, e.g. `water-uml export example.puml -f md`, a Markdown file will be created with embeded image. e.g. `![filename](server/svg/encodedPlantUMLString)`.

By default, the default PlantUML server [http://www.plantuml.com/plantuml](http://www.plantuml.com/plantuml) is used to render the image, so you can include these in your live Markdown files.

If you want to use a private live PlantUML server for rendering embeded Markdown images, pass the server URL using the `-r` or `--remote-server` options.

[example.md](https://github.com/Ebonsignori/plant-uml-water/blob/master/examples/example.md) is an example Markdown file generated from running an export on [example.puml](https://github.com/Ebonsignori/plant-uml-water/blob/master/examples/example.puml). See the raw Markdown [here](https://raw.githubusercontent.com/Ebonsignori/plant-uml-water/master/examples/example.md).

## Including files

Including local `.puml` files inside a `.puml` file (e.g. `!include ../globals/styles.puml`), and including standard libraries (e.g. `!include <foo/bar>`) are supported by this CLI tool.

File includes are parsed inline, allowing for local file includes to be rendered inside of markdown files via an encoded PlantUML string, like the styles that persist in [example.md](https://github.com/Ebonsignori/plant-uml-water/blob/master/examples/example.md).

See [example.puml](https://github.com/Ebonsignori/plant-uml-water/blob/master/examples/example.puml) to see an example of including [styles.puml](https://github.com/Ebonsignori/plant-uml-water/blob/master/examples/styles.puml) with the `!include` syntax.

## Using a local Docker PlantUML server

If you need to be offline or want to run a local server with custom options, you can spin up a PlantUML server in a Docker container.

Pass the `-l` flag to use a local PlantUML server running on port `8792` by default, or specify the PlantUML server's port with the `-d` flag.

For example, to use a server running on `localhost:8675` for converting a .puml,

```
water-uml export example.puml -l -d 8675
```

You can start a local PlantUML server on `localhost:8675` via Docker using the following:

1. Create/Initialize PlantUML server container

```
docker run -d -p 8792:8080 --name plantuml-server plantuml/plantuml-server:jetty
```

2. Stop the PlantUML server container

```
docker stop plantuml-server
```

3. Start stopped PlantUML server container

```
docker start plantuml-server
```

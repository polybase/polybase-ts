# Polybase

This monorepo contains the following packages:

[@polybase/client](https://github.com/polybase/polybase-ts/tree/main/packages/client): browser/node client

[@polybase/react](https://github.com/polybase/polybase-ts/tree/main/packages/eth): react wrapper for client

[@polybase/eth](https://github.com/polybase/polybase-ts/tree/main/packages/eth): ethereum helpers

[@polybase/util](https://github.com/polybase/polybase-ts/tree/main/packages/eth): encryption, signature and other helpers


## How to validate changes in `npm` package dependencies locally

In Library A:

  * First, ensure library A is prepared for `npm` usage. You should have a `package.json` in place with a name and version.

  * In the directory of library A, run the command `npm link`. This creates a symbolic link in the global `node_modules` directory to library A.

In Library B:

  * Run the command `npm link A`, replacing "A" with the name you specified for library A in its `package.json`. 
    This creates a symbolic link from your local `node_modules` to the global one for library A.

  * Now, if you run `npm install`, it will also install the dependencies of library A, and since we've linked it locally, it should use the latest code available.

Finally run `npm unlink` when done.

Note: In the case of the `@polybae/client` repo (for instance), library "A" would be any of its locally-changed dependencies (such as `@polybase/polylang`), 
      and library "B" would be `@polybase/client` itself.


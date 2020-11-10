import type { HttpFunction } from '@google-cloud/functions-framework/build/src/functions'

export const githubHook: HttpFunction = (req, res) => {
    res.send('Hello, World')
}

export function dev() {
    console.log('Hello World')
}

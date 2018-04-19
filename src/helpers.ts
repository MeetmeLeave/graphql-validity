/*!
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Vlad Martynenko <vladimir.martynenko.work@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { uuid } from './uuid';

// Config options for graphql-validity library
export declare type ValidityConfig = {
    // Allows to modify graphql error output to not show original error stack to the end user
    wrapErrors: boolean;
    // Enables profiling data output, to analyze the graphql performance
    enableProfiling: boolean;
    // Error wrapper function, which will modift error objects output
    unhandledErrorWrapper?: (error: Error) => Error;
    // Function which will recieve output, with profiling information for analysis
    profilingResultHandler?: (profilingResult: any) => void;
}

// Type used inside the field wrapper function to store processing information
export declare type FieldValidationObject = {
    // name of the field being validated
    fieldName: string;
    // name of the parent type for the field being validated
    parentTypeName?: string;
    // validity object used for graphql request to store validation results
    validity?: any;
    // path inside the AST tree used by grapql engine
    astPath?: string;
    // profiling start time
    pst?: Number;
    // validation end time
    vet?: Number;
    // execution end time
    eet?: Number;
}

// Error object, which must path through error masking
export class ValidityError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidityError";
    }
}

/**
 * Default error wrapper function to hide error info from end users
 *
 * @param {Error} error - unhandled error object
 * @returns {Error} - error object with critical data hidden
 */
export function onUnhandledError(error: Error): Error {
    if (error.name === 'ValidityError') {
        return error;
    }

    const id = uuid();

    console.error(`Unhandled error occured with id:${id}, error:${JSON.stringify(error, null, 2)}`);

    return new Error(`An internal error occured, with following id:${id}, please contact Administrator!`)
}
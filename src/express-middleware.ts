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

import { applyValidation } from "./validation";

export default (profilingResultHandler) => {
    /**
     * Middleware which will capture validation output and will add it to the original response
     *
     * @param req - express request
     * @param res - express response
     * @param next - next call
     */
    return function graphQLValidityExpressMiddleware(
        req: any,
        res: any,
        next: any
    ) {
        try {
            let originalSend = res.send;
            let originalWrite = res.write;
            req.__graphQLValidity = {
                ___validationResults: [],
                ___globalValidationResults: undefined,
                ___profilingData: []
            };

            let isProcessed = {
                processed: false
            };

            res.write = wrapOriginalResponder(req, res, originalWrite, isProcessed);
            res.send = wrapOriginalResponder(req, res, originalSend, isProcessed);
        }
        catch (err) {
            console.error(err)
        }
        finally {
            next();
        }
    }

    /**
     * Used to wrap express middleware write and send functions with response
     * modification to push validation results
     *
     * @param req - express request
     * @param res - express response
     * @param {Function} originalFunction - write or send function
     * @param isProcessed - object with boolean flag, to not run same wrapper twice.
     *
     * @returns {(data: any) => any} - wrapper function
     */
    function wrapOriginalResponder(
        req: any,
        res: any,
        originalFunction: Function,
        isProcessed: any
    ) {
        return function (data: any) {
            try {
                if (!isProcessed.processed) {
                    isProcessed.processed = true;
                    let result = applyValidation(req, data, profilingResultHandler.handler);
                    if (result) {
                        arguments[0] = result;
                    }
                }
            }
            catch (err) {
                console.error(err)
            }
            finally {
                originalFunction.apply(res, Array.from(arguments));
            }
        }
    }
}

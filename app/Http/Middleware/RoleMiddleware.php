<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle($request, \Closure $next, ...$roles)
    {
        if (! auth()->check()) {
            abort(403);
        }

        if (! in_array(auth()->user()->role, $roles)) {
            abort(403);
        }

        return $next($request);
    }
}

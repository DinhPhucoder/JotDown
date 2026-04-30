<?php

namespace App\Providers;

use App\Models\Note;
use App\Policies\NotePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Note::class, NotePolicy::class);

        // Khi chạy trong Docker/API, header Host có thể là tên service nội bộ.
        // Force URL root theo APP_URL để signed URL (email verify) luôn dùng địa chỉ đúng.
        $appUrl = config('app.url');
        if ($appUrl) {
            \Illuminate\Support\Facades\URL::forceRootUrl($appUrl);
        }
    }
}

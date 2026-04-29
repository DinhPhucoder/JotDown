<?php

namespace Database\Factories;

use App\Models\Note;
use Illuminate\Database\Eloquent\Factories\Factory;

class NoteFactory extends Factory
{
    protected $model = Note::class;

    public function definition(): array
    {
        return [
            'user_id' => 1,
            'title' => $this->faker->sentence,
            'content' => $this->faker->paragraph,
            'color' => '#' . str_pad(dechex(mt_rand(0, 0xFFFFFF)), 6, '0', STR_PAD_LEFT),
            'is_pinned' => false,
            'is_protected' => false,
            'version' => 1,
        ];
    }

    public function pinned(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_pinned' => true,
            'pinned_at' => now(),
        ]);
    }

    public function protected(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_protected' => true,
            'password' => bcrypt('password'),
        ]);
    }
}

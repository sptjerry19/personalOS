<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('supabase_id')->nullable()->unique();
            $table->string('avatar_url')->nullable();
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            $usersTable = Schema::getConnection()->getTablePrefix().'users';
            DB::statement("ALTER TABLE {$usersTable} ALTER COLUMN password DROP NOT NULL");
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['supabase_id', 'avatar_url']);
        });
    }
};

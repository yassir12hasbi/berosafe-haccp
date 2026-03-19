<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up()
{
    Schema::table('users', function (Blueprint $table) {
        $table->foreignId('role_id')->after('password')->constrained('roles');
        $table->foreignId('establishment_id')->nullable()->after('role_id')->constrained('establishments');
        $table->string('code')->unique()->after('email');
        $table->boolean('status')->default(true)->after('code');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->string('code');
            $table->string('name');
            $table->timestamps();
            
            $table->unique(['warehouse_id', 'code']);
        });

        Schema::create('racks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zone_id')->constrained('zones')->onDelete('cascade');
            $table->string('code');
            $table->string('name');
            $table->timestamps();
            
            $table->unique(['zone_id', 'code']);
        });

        Schema::create('shelves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rack_id')->constrained('racks')->onDelete('cascade');
            $table->string('code');
            $table->string('name');
            $table->timestamps();
            
            $table->unique(['rack_id', 'code']);
        });

        Schema::create('bins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shelf_id')->constrained('shelves')->onDelete('cascade');
            $table->string('code');
            $table->string('name');
            $table->timestamps();
            
            $table->unique(['shelf_id', 'code']);
        });

        Schema::table('barang', function (Blueprint $table) {
            $table->foreignId('bin_id')->nullable()->after('bin_location')->constrained('bins')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('barang', function (Blueprint $table) {
            $table->dropForeign(['bin_id']);
            $table->dropColumn('bin_id');
        });

        Schema::dropIfExists('bins');
        Schema::dropIfExists('shelves');
        Schema::dropIfExists('racks');
        Schema::dropIfExists('zones');
    }
};

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
        Schema::table('barang', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('nama_barang');
            $table->string('bin_location')->nullable()->after('satuan');
        });

        Schema::table('stock_ledgers', function (Blueprint $table) {
            $table->foreignId('gudang_id')->nullable()->after('project_id')->constrained('warehouses')->onDelete('restrict');
        });

        Schema::table('barang_masuk', function (Blueprint $table) {
            $table->foreignId('gudang_id')->nullable()->after('project_id')->constrained('warehouses')->onDelete('restrict');
        });

        Schema::table('pemakaian_barang', function (Blueprint $table) {
            $table->foreignId('gudang_id')->nullable()->after('project_id')->constrained('warehouses')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pemakaian_barang', function (Blueprint $table) {
            $table->dropForeign(['gudang_id']);
            $table->dropColumn('gudang_id');
        });

        Schema::table('barang_masuk', function (Blueprint $table) {
            $table->dropForeign(['gudang_id']);
            $table->dropColumn('gudang_id');
        });

        Schema::table('stock_ledgers', function (Blueprint $table) {
            $table->dropForeign(['gudang_id']);
            $table->dropColumn('gudang_id');
        });

        Schema::table('barang', function (Blueprint $table) {
            $table->dropColumn(['brand', 'bin_location']);
        });
    }
};

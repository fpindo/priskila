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
        Schema::create('stock_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barang_id')->constrained('barang')->onDelete('restrict');
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('restrict');
            $table->enum('tipe_transaksi', ['MASUK', 'KELUAR', 'ADJUSTMENT']);
            $table->unsignedBigInteger('referensi_id'); // ID of barang_masuk or pemakaian_barang
            $table->integer('jumlah'); // positive or negative
            $table->integer('saldo_stock'); // running balance of item
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_ledgers');
    }
};

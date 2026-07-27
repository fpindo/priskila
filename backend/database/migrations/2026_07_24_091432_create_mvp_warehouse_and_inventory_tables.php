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
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('kode_gudang')->unique();
            $table->string('nama_gudang');
            $table->text('alamat')->nullable();
            $table->timestamps();
        });

        Schema::create('gudang_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_dokumen')->unique();
            $table->date('tanggal_transfer');
            $table->foreignId('gudang_asal_id')->constrained('warehouses')->onDelete('restrict');
            $table->foreignId('gudang_tujuan_id')->constrained('warehouses')->onDelete('restrict');
            $table->text('catatan')->nullable();
            $table->string('status')->default('PENDING'); // PENDING, APPROVED, REJECTED
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('gudang_transfer_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gudang_transfer_id')->constrained('gudang_transfers')->onDelete('cascade');
            $table->foreignId('barang_id')->constrained('barang')->onDelete('restrict');
            $table->integer('jumlah');
            $table->timestamps();
        });

        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_dokumen')->unique();
            $table->date('tanggal_adjustment');
            $table->foreignId('gudang_id')->constrained('warehouses')->onDelete('restrict');
            $table->text('catatan')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('stock_adjustment_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_adjustment_id')->constrained('stock_adjustments')->onDelete('cascade');
            $table->foreignId('barang_id')->constrained('barang')->onDelete('restrict');
            $table->integer('jumlah');
            $table->timestamps();
        });

        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_dokumen')->unique();
            $table->date('tanggal_opname');
            $table->foreignId('gudang_id')->constrained('warehouses')->onDelete('restrict');
            $table->text('catatan')->nullable();
            $table->string('status')->default('DRAFT'); // DRAFT, FINAL
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('stock_opname_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_opname_id')->constrained('stock_opnames')->onDelete('cascade');
            $table->foreignId('barang_id')->constrained('barang')->onDelete('restrict');
            $table->integer('stok_sistem');
            $table->integer('stok_fisik');
            $table->integer('selisih');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_opname_details');
        Schema::dropIfExists('stock_opnames');
        Schema::dropIfExists('stock_adjustment_details');
        Schema::dropIfExists('stock_adjustments');
        Schema::dropIfExists('gudang_transfer_details');
        Schema::dropIfExists('gudang_transfers');
        Schema::dropIfExists('warehouses');
    }
};

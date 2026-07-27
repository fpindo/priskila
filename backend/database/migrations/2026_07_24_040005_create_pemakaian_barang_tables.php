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
        Schema::create('pemakaian_barang', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_dokumen')->unique();
            $table->date('tanggal_pemakaian');
            $table->foreignId('project_id')->constrained('projects')->onDelete('restrict');
            $table->text('keterangan')->nullable();
            $table->enum('status_approval', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('restrict');
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });

        Schema::create('pemakaian_barang_detail', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pemakaian_barang_id')->constrained('pemakaian_barang')->onDelete('cascade');
            $table->foreignId('barang_id')->constrained('barang')->onDelete('restrict');
            $table->integer('jumlah');
            $table->string('catatan')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pemakaian_barang_detail');
        Schema::dropIfExists('pemakaian_barang');
    }
};

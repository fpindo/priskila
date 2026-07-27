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
        Schema::create('delivery_orders', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_dokumen')->unique();
            $table->date('tanggal_delivery');
            $table->foreignId('pemakaian_barang_id')->nullable()->constrained('pemakaian_barang')->onDelete('set null');
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('set null');
            $table->string('nama_penerima');
            $table->text('alamat_tujuan');
            $table->text('catatan')->nullable();
            $table->string('verification_token')->unique();
            $table->string('status')->default('DRAFT'); // DRAFT, IN_TRANSIT, DELIVERED
            $table->string('signature_path')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('delivery_order_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_order_id')->constrained('delivery_orders')->onDelete('cascade');
            $table->foreignId('barang_id')->constrained('barang')->onDelete('restrict');
            $table->integer('jumlah');
            $table->string('catatan')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_order_id')->constrained('delivery_orders')->onDelete('cascade');
            $table->string('photo_path');
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_photos');
        Schema::dropIfExists('delivery_order_details');
        Schema::dropIfExists('delivery_orders');
    }
};

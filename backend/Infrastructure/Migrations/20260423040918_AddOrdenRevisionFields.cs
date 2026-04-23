using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOrdenRevisionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EsRevision",
                table: "OrdenesServicio",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PlanRevisionId",
                table: "OrdenesServicio",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesServicio_PlanRevisionId",
                table: "OrdenesServicio",
                column: "PlanRevisionId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrdenesServicio_PlanesRevision_PlanRevisionId",
                table: "OrdenesServicio",
                column: "PlanRevisionId",
                principalTable: "PlanesRevision",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrdenesServicio_PlanesRevision_PlanRevisionId",
                table: "OrdenesServicio");

            migrationBuilder.DropIndex(
                name: "IX_OrdenesServicio_PlanRevisionId",
                table: "OrdenesServicio");

            migrationBuilder.DropColumn(
                name: "EsRevision",
                table: "OrdenesServicio");

            migrationBuilder.DropColumn(
                name: "PlanRevisionId",
                table: "OrdenesServicio");
        }
    }
}

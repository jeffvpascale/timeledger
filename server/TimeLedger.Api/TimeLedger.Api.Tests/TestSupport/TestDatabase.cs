using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TimeLedger.Api.Data;

namespace TimeLedger.Api.Tests.TestSupport;

internal sealed class TestDatabase : IAsyncDisposable
{
	public SqliteConnection Connection { get; }
	public TimeLedgerDbContext Db { get; }

	private TestDatabase(
		SqliteConnection connection,
		TimeLedgerDbContext db)
	{
		Connection = connection;
		Db = db;
	}

	public static async Task<TestDatabase> CreateAsync()
	{
		var connection = new SqliteConnection("Data Source=:memory:");
		await connection.OpenAsync();

		var options = new DbContextOptionsBuilder<TimeLedgerDbContext>()
			.UseSqlite(connection)
			.Options;

		var db = new TimeLedgerDbContext(options);
		await db.Database.EnsureCreatedAsync();

		return new TestDatabase(connection, db);
	}

	public async ValueTask DisposeAsync()
	{
		await Db.DisposeAsync();
		await Connection.DisposeAsync();
	}
}
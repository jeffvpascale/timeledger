using TimeLedger.Api.Data;
using TimeLedger.Api.Data.Entities;

namespace TimeLedger.Api.Tests.TestSupport;

internal static class TestData
{
	internal static async Task<Client> SeedClientAsync(
		TimeLedgerDbContext db,
		string name = "Acme Corporation",
		bool isArchived = false)
	{
		var client = new Client
		{
			Name = name,
			IsArchived = isArchived
		};

		db.Clients.Add(client);
		await db.SaveChangesAsync();

		return client;
	}

	internal static async Task<Project> SeedProjectAsync(
		TimeLedgerDbContext db,
		string name = "Website Redesign",
		string description = "Redesign and development of company website",
		decimal rate = 100m,
		bool isArchived = false,
		int clientId = 1)
	{
		var project = new Project
		{
			Name = name,
			Description = description,
			Rate = rate,
			IsArchived = isArchived,
			ClientId = clientId
		};

		db.Projects.Add(project);
		await db.SaveChangesAsync();

		return project;
	}
}

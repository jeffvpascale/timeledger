using System.ComponentModel.DataAnnotations;

namespace TimeLedger.Api.Data.Entities
{
	public class Client
	{
		public int Id { get; set; }

		[Required]
		public required string Name { get; set; } = string.Empty;

		public bool IsArchived { get; set; }

		public ICollection<Project> Projects { get; } = new List<Project>();

	}
}
